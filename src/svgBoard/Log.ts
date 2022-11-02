export class Log {
  public static Error(message: string) {
    console.error(message)
  }

  public static Warn(message: string) {
    console.warn(message)
  }
  public static Info(message: string) {
    console.info(message)
  }

  public static blue(message: string) {
    console.info("%c " + message, "color:blue;")
  }
  public static red(message: string) {
    console.info("%c " + message, "color:red;")
  }
}
