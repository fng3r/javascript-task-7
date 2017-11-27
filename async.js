'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

class AsyncRunner {
    constructor(jobs, parallelNum, timeout) {
        this._jobsCount = jobs.length;
        this._pendingPromises = jobs
            .map((job, index) => ({ promise: this._getPromiseWithTimeout(job, timeout), index }));
        this._parallelNum = parallelNum;
        this._result = [];
        this._finishedJobsCount = 0;
    }

    run() {
        return new Promise(resolve => {
            if (this._parallelNum > 0 && this._pendingPromises.length) {
                for (const promise of this._pendingPromises.splice(0, this._parallelNum)) {
                    this._runNext(resolve, promise);
                }
            } else {
                resolve([]);
            }

        });
    }

    _runNext(resolve, { index, promise }) {
        const cb = data => this._onResponse(resolve, index, data);
        promise.then(cb).catch(cb);
    }

    _onResponse(resolve, index, data) {
        this._result[index] = data;
        if (++this._finishedJobsCount >= this._jobsCount) {
            resolve(this._result);
        } else if (this._pendingPromises.length) {
            this._runNext(resolve, this._pendingPromises.shift());
        }
    }

    _getPromiseWithTimeout(job, timeout) {
        return new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Promise timeout')), timeout);
            job()
                .then(resolve)
                .catch(reject);
        });
    }
}

/** Функция паралелльно запускает указанное число промисов
 * @param {Function[]} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 * @returns {Promise<[]>} - промис, который зарезолвится c массивом результатов выполнения jobs
 */
function runParallel(jobs, parallelNum, timeout = 1000) {
    return new AsyncRunner(jobs, parallelNum, timeout).run();
}
