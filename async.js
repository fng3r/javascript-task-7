'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

class AsyncRunner {
    constructor(jobs, parallelNum, timeout) {
        this._jobsCount = jobs.length;
        this._pendingJobs = jobs
            .map((job, index) => [index, this._getPromiseWithTimeout(job, timeout)]);
        this._parallelNum = parallelNum;
        this._result = [];
        this._finishedJobsCount = 0;
    }

    run() {
        return new Promise(resolve => {
            if (this._parallelNum > 0 && this._jobsCount) {
                const jobsToBeRun = this._pendingJobs.splice(0, this._parallelNum);
                for (const job of jobsToBeRun) {
                    this._runNext(resolve, ...job);
                }
            } else {
                resolve([]);
            }
        });
    }

    _runNext(resolve, index, promise) {
        const cb = data => this._onResponse(resolve, index, data);
        promise.then(cb).catch(cb);
    }

    _onResponse(resolve, index, data) {
        this._result[index] = data;
        if (++this._finishedJobsCount === this._jobsCount) {
            resolve(this._result);
        } else if (this._pendingJobs.length) {
            this._runNext(resolve, ...this._pendingJobs.shift());
        }
    }

    _getPromiseWithTimeout(job, timeout) {
        return new Promise((resolve, reject) => {
            job()
                .then(resolve)
                .catch(reject);
            setTimeout(() => reject(new Error('Promise timeout')), timeout);
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
