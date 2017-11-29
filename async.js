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
    const result = [];
    let startedJobsCount = 0;
    let finishedJobsCount = 0;

    return new Promise(resolve => {
        if (!jobs.length) {
            resolve([]);
        } else {
            while (startedJobsCount < parallelNum) {
                runNext(resolve, startedJobsCount++);
            }
        }
    });

    function runNext(resolve, jobIndex) {
        const cb = data => onResponse(resolve, jobIndex, data);

        new Promise((innerResolve, innerReject) => {
            jobs[jobIndex]().then(innerResolve, innerReject);
            setTimeout(() => innerReject(new Error('Promise timeout')), timeout);
        }).then(cb, cb);
    }

    function onResponse(resolve, index, data) {
        result[index] = data;
        if (jobs.length === ++finishedJobsCount) {
            resolve(result);
        } else if (startedJobsCount < jobs.length) {
            runNext(resolve, startedJobsCount++);
        }
    }
}
