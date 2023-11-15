/**
 * 路由加载器
 * Created by yuchimin on 2018/8/22.
 */
const router = require('koa-router')();
const glob = require('glob');

glob.sync(__dirname + '/controller/**/*.js').forEach(file => {
    const ctrlObj = require(file);
    for (let i in ctrlObj) {
        let path = '/api' + ctrlObj[i].path;
        let method = ctrlObj[i].method || 'get|post';
        let handler = ctrlObj[i].handler;
        let arr = method.split('|');

        for(let j of arr){

            let method_item = j.trim().toLocaleLowerCase();
            if (!method_item) continue;

            console.log(`register url: ${method}-${path}`);

            if (typeof handler === 'function') {
                router[method_item](path, handler);
            }
            console.log(method_item + '\t: ' + path);

        }
    }
});

module.exports = router;
