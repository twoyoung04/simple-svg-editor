export class Command {
  public apply() {}
  public unApply() {}
}

export class CreateElementCommand extends Command {}
export class ChangeElementCommand extends Command {}

export class UndoManager {}
