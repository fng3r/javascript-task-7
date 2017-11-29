'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

/** Функция паралелльно запускает указанное число промисов
 * @param {Function[]} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 * @returns {Promise<[]>} - промис, который зарезолвится c массивом результатов выполнения jobs
 */
function runParallel(jobs, parallelNum, timeout = 1000) {
    const pendingJobs = jobs
        .map((job, index) => [index, getPromiseWithTimeout(job, timeout)]);
    const result = [];
    let finishedJobsCount = 0;

    return new Promise(resolve => {
        if (parallelNum < 1 || !jobs.length) {
            resolve([]);
        } else {
            for (const job of pendingJobs.splice(0, parallelNum)) {
                runNext(resolve, ...job);
            }
        }
    });

    function runNext(resolve, index, promise) {
        const cb = data => onResponse(resolve, index, data);
        promise.then(cb).catch(cb);
    }

    function onResponse(resolve, index, data) {
        result[index] = data;
        if (++finishedJobsCount === jobs.length) {
            resolve(result);
        } else if (pendingJobs.length) {
            runNext(resolve, ...pendingJobs.shift());
        }
    }

    function getPromiseWithTimeout(job) {
        return new Promise((resolve, reject) => {
            job().then(resolve, resolve);
            setTimeout(() => reject(new Error('Promise timeout')), timeout);
        });
    }
}
