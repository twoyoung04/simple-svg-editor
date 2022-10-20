export class Log {
  public static Error(message: string) {
    console.error(message);
  }

  public static blue(message: string) {
    console.info("%c " + message, "color:blue;");
  }
  public static red(message: string) {
    console.info("%c " + message, "color:red;");
  }
}
