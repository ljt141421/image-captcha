const Sequelize = require('sequelize');

//兼容阿里云PolarDB查询时指定参数 useMaster=true 时强制从主库查询
Sequelize.prototype._query = Sequelize.prototype.query;
Sequelize.prototype.query = function(sql, options) {
    if(options.useMaster) {
        if(typeof sql === 'object') {
            sql.query = '/*FORCE_MASTER*/' + sql.query;
        } else {
            sql = '/*FORCE_MASTER*/' + sql;
        }
    } 
    return this._query(sql, options)
}

/**
 * 
 * @param {string} sql 查询语句
 * @param {object} options 参数
 */
Sequelize.prototype.queryp = async function (sql, options) {

    if(sql.endsWith(';')) sql = sql.substring(0,sql.length-1);
    let sql_count = `SELECT COUNT(1) as count FROM (${sql}) AS T;`;

    if(!options.limit) options.limit = options.page_number || 10;
    if(!options.offset) options.offset = ((options.page_index || 1) - 1) * options.limit;
    let sql_rows = `${sql} limit ${options.offset}, ${options.limit};`;

    //1、QueryTypes指定为SELECT模式
    Object.assign(options, {
        type: this.QueryTypes.SELECT
    });
    //2、获得总行数
    let count = await this.query(sql_count, options).then(function(res){
        return res[0].count;
    });
    //3、查询当前页记录
    let rows = await this.query(sql_rows, options);
    return {
        total_rows: count,
        total_page: Math.ceil(count/options.limit),
        page_index: Math.ceil(options.offset/options.limit),
        page_number: options.limit,
        list: rows
    }
}

/**
 * 解决 JSON.stringify() 日期时间不对问题，所以重写
 * @author: jess.zou  at 2019-3-16
 */
Date.prototype.format = function(fmt) {
    var o = {
        "M+" : this.getMonth()+1,                 //月份 
        "d+" : this.getDate(),                    //日 
        "h+" : this.getHours(),                   //小时 
        "m+" : this.getMinutes(),                 //分 
        "s+" : this.getSeconds(),                 //秒 
        "q+" : Math.floor((this.getMonth()+3)/3), //季度 
        "S"  : this.getMilliseconds()             //毫秒 
    };
    if(/(y+)/.test(fmt)) {
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    }
    for(var k in o) {
        if(new RegExp("("+ k +")").test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        }
    }
    return fmt;
}
/* 
 * 重写时间的toJSON方法，因为在调用JSON.stringify的时候，时间转换就调用的toJSON，这样会导致少8个小时，所以重写它的toJSON方法
 */
Date.prototype.toJSON = function () {
    return this.format("yyyy-MM-dd hh:mm:ss"); // util.formatDate是自定义的个时间格式化函数
}

module.exports = Sequelize;