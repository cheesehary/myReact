abstract class Transaction {
  protected initData: Array<any>;
  protected wrappers: Array<{ initialize: Function; close: Function }>;

  constructor() {
    this.initData = [];
  }

  perform(fn: Function, context, ...args) {
    let ret;
    let error = true;
    try {
      this.initializeAll(0);
      ret = fn.apply(context, args);
      error = false;
    } finally {
      if (error) {
        try {
          this.closeAll(0);
        } catch (e) {}
      }
      this.closeAll(0);
    }
    return ret;
  }

  initializeAll(from: number) {
    const wrappers = this.wrappers;
    for (let i = from; i < wrappers.length; i++) {
      const wrapper = wrappers[i];
      try {
        this.initData[i] = wrapper.initialize
          ? wrapper.initialize.call(this)
          : null;
      } catch {
        try {
          this.initializeAll(i + 1);
        } catch (e) {}
      }
    }
  }

  closeAll(from: number) {}
}
