/**
 * Created by yuchimin on 2018/8/22.
 * ORM
 */
const glob = require('glob');
const path = require('path');
// const Sequelize = require('sequelize');
const Sequelize = require("../../common/sequelize");
const configs = require('../../configs');

//默认取目录名称作为数据库配置节点
let node = path.basename(__dirname);
let config = configs.mysql[node];

const sequelize = new Sequelize(config.dbname,
    config.username,
    config.password,
    Object.assign({
        dialect: 'mysql',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            underscored: false,
            charset: 'utf8mb4',
            freezeTableName: true,
            dialectOptions: {
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci'
            },
            timestamps: true
        },
        timezone: '+08:00', //东八时区
        // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
        operatorsAliases: 0
    }, config.options)
);

const pattern = path.join(__dirname, '/defines/**/*.js');

let classes = {};
glob.sync(pattern).forEach(file => {
    let name = path.basename(file, '.js');
    console.log(`${name}<--->${file}`);
    let cls = sequelize.import(file);
    cls.sync();
    console.log(cls);
    classes[name] = cls;
});

module.exports = classes;