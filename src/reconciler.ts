import Transaction from "./Transaction";

export class MountTransaction extends Transaction {
  private mountQueue: Array<Function>;

  constructor() {
    super([DOMReady]);
  }

  enqueue(fn: Function) {
    this.mountQueue.push(fn);
  }
}

const DOMReady = {
  initialize: function() {
    this.mountQueue = [];
  },
  close: function() {
    this.mountQueue.forEach(fn => fn());
    this.mountQueue = null;
  }
};

class BatchTransaction extends Transaction {
  constructor() {
    super([FlushUpdates, ResetUpdates]);
  }
}

const batchTransaction = new BatchTransaction();
export const batchUpdate = (fn: Function, ...args) => {
  if (isBatching) {
    fn.apply(null, args);
  } else {
    batchTransaction.perform(fn, null, args);
  }
};

let isBatching = false;

const FlushUpdates = {
  initialize: function() {},
  close: flush
};

const ResetUpdates = {
  initialize: function() {},
  close: function() {
    isBatching = false;
  }
};

function flush() {}
