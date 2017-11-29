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
    let finishedJobsCount = 0;

    return new Promise(resolve => {
        if (parallelNum < 1 || !jobs.length) {
            resolve([]);
        } else {
            for (let i = 0; i < parallelNum; i++) {
                runNext(resolve, i);
            }
        }
    });

    function runNext(resolve, index) {
        const cb = data => onResponse(resolve, index, data);
        new Promise((innerResolve, innerReject) => {
            jobs[index]().then(innerResolve, innerReject);
            setTimeout(() => innerReject(new Error('Promise timeout')), timeout);
        }).then(cb, cb);
    }

    function onResponse(resolve, index, data) {
        result[index] = data;
        if (++finishedJobsCount === jobs.length) {
            resolve(result);
        } else {
            runNext(resolve, finishedJobsCount);
        }
    }
}
