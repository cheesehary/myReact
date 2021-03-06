export default class Transaction {
  private initData: Array<any>;
  private wrappers: Array<{ initialize: Function; close: Function }>;

  constructor(wrappers) {
    this.initData = [];
    this.wrappers = wrappers;
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
      } else {
        this.closeAll(0);
      }
    }
    return ret;
  }

  private initializeAll(from: number) {
    const wrappers = this.wrappers;
    for (let i = from; i < wrappers.length; i++) {
      const wrapper = wrappers[i];
      try {
        this.initData[i] = WrapperError;
        this.initData[i] = wrapper.initialize
          ? wrapper.initialize.call(this)
          : null;
      } finally {
        if (this.initData[i] === WrapperError) {
          try {
            this.initializeAll(i + 1);
          } catch (e) {}
        }
      }
    }
  }

  private closeAll(from: number) {
    const wrappers = this.wrappers;
    for (let i = from; i < wrappers.length; i++) {
      const wrapper = wrappers[i];
      let error = true;
      try {
        if (wrapper.close && this.initData[i] !== WrapperError) {
          wrapper.close.call(this, this.initData[i]);
        }
        error = false;
      } finally {
        if (error) {
          try {
            this.closeAll(i + 1);
          } catch (e) {}
        }
      }
    }
    this.initData = [];
  }
}

const WrapperError = "wrapper_error";
