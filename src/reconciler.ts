import Transaction from "./Transaction";
import { IReactClassComponent } from "./interfaces";

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
    super([FlushUpdates, ResetBatch]);
  }
}

export const batchUpdate = (fn: Function, ...args) => {
  if (isBatching) {
    fn.apply(null, args);
  } else {
    isBatching = true;
    batchTransaction.perform(fn, null, ...args);
  }
};
export const enqueueUpdate = (component: IReactClassComponent) => {
  if (!isBatching) {
    batchUpdate(enqueueUpdate, component);
  } else {
    dirtyComponents.push(component);
  }
};

const FlushUpdates = {
  initialize: function() {},
  close: flush
};

const ResetBatch = {
  initialize: function() {},
  close: function() {
    isBatching = false;
  }
};

class FlushTransaction extends Transaction {
  public mountTransaction: MountTransaction;
  public dirtyLength: number;
  private callbackQueue: Array<Function>;

  constructor() {
    super([NestedUpdates, UpdateReady]);
    this.mountTransaction = new MountTransaction();
  }

  enqueue(fn: Function) {
    this.callbackQueue.push(fn);
  }
}

const NestedUpdates = {
  initialize: function() {
    this.dirtyLength = dirtyComponents.length;
  },
  close: function() {
    if (this.dirtyLength !== dirtyComponents.length) {
      dirtyComponents.splice(0, this.dirtyLength);
      flush();
    } else {
      dirtyComponents = [];
    }
  }
};

const UpdateReady = {
  initialize: function() {
    this.callbackQueue = [];
  },
  close: function() {
    this.callbackQueue.forEach(fn => fn());
    this.callbackQueue = null;
  }
};

function flush() {
  if (dirtyComponents.length) {
    const flushTransaction = new FlushTransaction();
    flushTransaction.perform(updateDirtyComponents, null, flushTransaction);
  }
}

function updateDirtyComponents(transaction: FlushTransaction) {
  const length = transaction.dirtyLength;
  dirtyComponents.sort((a, b) => a._mountOrder - b._mountOrder);
  for (let i = 0; i < length; i++) {
    const dirtyComp = dirtyComponents[i];
    const callbacks = dirtyComp._pendingCallbacks;
    dirtyComp.updateComponentIfNecessary(transaction.mountTransaction);
    if (callbacks) {
      callbacks.forEach(callback =>
        transaction.enqueue(callback.bind(dirtyComp._instance))
      );
    }
  }
}

let isBatching = false;

let dirtyComponents: Array<IReactClassComponent> = [];

const batchTransaction = new BatchTransaction();
