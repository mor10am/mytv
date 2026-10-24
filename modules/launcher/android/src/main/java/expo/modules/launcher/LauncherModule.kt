package expo.modules.launcher

import android.app.ActivityManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.Environment
import android.os.Process
import android.os.StatFs
import android.os.SystemClock
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream

private const val APPS_CHANGED = "onAppsChanged"

class LauncherModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private var packageReceiver: BroadcastReceiver? = null

  override fun definition() = ModuleDefinition {
    Name("Launcher")

    Events(APPS_CHANGED)

    AsyncFunction("getInstalledApps") {
      getInstalledApps()
    }

    Function("launchApp") { packageName: String, activityName: String ->
      val intent = Intent(Intent.ACTION_MAIN)
        .setComponent(ComponentName(packageName, activityName))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
      context.startActivity(intent)
    }

    AsyncFunction("getMemoryInfo") {
      val info = ActivityManager.MemoryInfo()
      (context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).getMemoryInfo(info)
      mapOf(
        "availMem" to info.availMem.toDouble(),
        "totalMem" to info.totalMem.toDouble(),
        "lowMemory" to info.lowMemory,
      )
    }

    AsyncFunction("getStorageInfo") {
      val stat = StatFs(Environment.getDataDirectory().path)
      mapOf(
        "availBytes" to stat.availableBytes.toDouble(),
        "totalBytes" to stat.totalBytes.toDouble(),
      )
    }

    // Cumulative idle and total CPU time; two samples give CPU usage. Falls back to this
    // app's own CPU time when the device exposes no system-wide counters.
    AsyncFunction("getCpuSample") {
      val system = readProcStat() ?: readProcUptime() ?: readCpuIdle()
      val (idle, total) = system ?: readOwnCpu()
      mapOf("idle" to idle, "total" to total, "scope" to if (system != null) "system" else "self")
    }

    Function("openSettings") {
      context.startActivity(
        Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    }

    OnStartObserving(APPS_CHANGED) {
      unregisterPackageReceiver()
      val receiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context, intent: Intent) {
          // The module can be torn down (e.g. JS reload) before the receiver is removed.
          runCatching { sendEvent(APPS_CHANGED) }
        }
      }
      val filter = IntentFilter().apply {
        addAction(Intent.ACTION_PACKAGE_ADDED)
        addAction(Intent.ACTION_PACKAGE_REMOVED)
        addAction(Intent.ACTION_PACKAGE_CHANGED)
        addDataScheme("package")
      }
      // Package broadcasts come from the system, so the receiver need not be exported.
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
      } else {
        context.registerReceiver(receiver, filter)
      }
      packageReceiver = receiver
    }

    OnStopObserving(APPS_CHANGED) {
      unregisterPackageReceiver()
    }

    // OnStopObserving isn't called when the React context is destroyed, so clean up here too.
    OnDestroy {
      unregisterPackageReceiver()
    }
  }

  private fun unregisterPackageReceiver() {
    val receiver = packageReceiver ?: return
    packageReceiver = null
    runCatching { appContext.reactContext?.unregisterReceiver(receiver) }
  }

  private fun getInstalledApps(): List<Map<String, Any?>> {
    val pm = context.packageManager
    val ownPackage = context.packageName

    // TV apps first (they have banners), then regular launcher apps not already seen.
    val activities = LinkedHashMap<String, ActivityInfo>()
    for (category in listOf(Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER)) {
      val query = Intent(Intent.ACTION_MAIN).addCategory(category)
      for (info in pm.queryIntentActivities(query, 0)) {
        val activity = info.activityInfo
        if (activity.packageName == ownPackage) continue
        activities.putIfAbsent(activity.packageName, activity)
      }
    }

    val iconDir = File(context.cacheDir, "launcher-icons").apply { mkdirs() }

    return activities.values
      .map { activity ->
        val updated = runCatching {
          pm.getPackageInfo(activity.packageName, 0).lastUpdateTime
        }.getOrDefault(0L)
        val banner = activity.loadBanner(pm)
        mapOf(
          "packageName" to activity.packageName,
          "activityName" to activity.name,
          "label" to activity.loadLabel(pm).toString(),
          "banner" to banner?.let {
            saveDrawable(it, File(iconDir, "${activity.packageName}-$updated-banner.png"))
          },
          "icon" to saveDrawable(
            activity.loadIcon(pm),
            File(iconDir, "${activity.packageName}-$updated-icon.png")
          ),
        )
      }
      .sortedBy { (it["label"] as String).lowercase() }
  }

  // Apps may only read these on some devices: SELinux usually blocks /proc/stat and
  // /proc/uptime since Android 8. All values are (idle, total) in arbitrary but matching units.

  private fun readProcStat(): Pair<Double, Double>? = runCatching {
    // "cpu  user nice system idle iowait irq softirq steal ..." in jiffies.
    val fields = File("/proc/stat").useLines { it.first() }
      .trim().split(Regex("\\s+")).drop(1).take(8).map { it.toDouble() }
    Pair(fields[3] + fields[4], fields.sum())
  }.getOrNull()

  private fun readProcUptime(): Pair<Double, Double>? = runCatching {
    // "uptime idle" in seconds; idle is summed over all cores.
    val (uptime, idle) = File("/proc/uptime").readText().trim().split(Regex("\\s+"))
    Pair(idle.toDouble(), uptime.toDouble() * Runtime.getRuntime().availableProcessors())
  }.getOrNull()

  private fun readCpuIdle(): Pair<Double, Double>? = runCatching {
    // Time each core spent in its idle states, in microseconds, against wall time.
    val cores = File("/sys/devices/system/cpu").listFiles { f -> f.name.matches(Regex("cpu\\d+")) }
      ?.mapNotNull { File(it, "cpuidle").listFiles { s -> s.name.startsWith("state") } }
      ?.filter { it.isNotEmpty() }
      .orEmpty()
    if (cores.isEmpty()) return@runCatching null
    val idle = cores.sumOf { states -> states.sumOf { File(it, "time").readText().trim().toDouble() } }
    val now = SystemClock.elapsedRealtimeNanos() / 1000.0
    Pair(idle, now * cores.size)
  }.getOrNull()

  private fun readOwnCpu(): Pair<Double, Double> {
    // CPU time used by this process against wall time on all cores, in milliseconds.
    val total = SystemClock.elapsedRealtime().toDouble() * Runtime.getRuntime().availableProcessors()
    return Pair(total - Process.getElapsedCpuTime(), total)
  }

  // Writes the drawable as a PNG (once per app version) and returns its file:// URI.
  private fun saveDrawable(drawable: Drawable, file: File): String? = runCatching {
    if (!file.exists()) {
      val bitmap = drawableToBitmap(drawable)
      FileOutputStream(file).use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }
    "file://${file.absolutePath}"
  }.getOrNull()

  private fun drawableToBitmap(drawable: Drawable): Bitmap {
    if (drawable is BitmapDrawable && drawable.bitmap != null) return drawable.bitmap
    val width = drawable.intrinsicWidth.takeIf { it > 0 } ?: 192
    val height = drawable.intrinsicHeight.takeIf { it > 0 } ?: 192
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, width, height)
    drawable.draw(canvas)
    return bitmap
  }
}
