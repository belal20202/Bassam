// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
  alias(libs.plugins.android.application) apply false
  alias(libs.plugins.kotlin.compose) apply false
  alias(libs.plugins.google.devtools.ksp) apply false
  alias(libs.plugins.roborazzi) apply false
  alias(libs.plugins.secrets) apply false
  alias(libs.plugins.google.services) apply false
}

// Automatically ensure debug.keystore exists in rootDir for CI environments (e.g. GitHub Actions)
val debugKeystoreFile = file("${rootDir}/debug.keystore")
if (!debugKeystoreFile.exists()) {
  val base64KeystoreFile = file("${rootDir}/debug.keystore.base64")
  if (base64KeystoreFile.exists()) {
    try {
      val decoded = java.util.Base64.getMimeDecoder().decode(base64KeystoreFile.readText().trim())
      debugKeystoreFile.writeBytes(decoded)
    } catch (_: Exception) {}
  }
  if (!debugKeystoreFile.exists()) {
    try {
      ProcessBuilder(
        "keytool", "-genkey", "-v",
        "-keystore", debugKeystoreFile.absolutePath,
        "-storepass", "android",
        "-alias", "androiddebugkey",
        "-keypass", "android",
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-dname", "CN=Android Debug,O=Android,C=US"
      ).start().waitFor()
    } catch (_: Exception) {}
  }
}
