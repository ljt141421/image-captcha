/**
 * table: image_code
 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('image_code', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            comment: "ID"
        },
        url: {
            type: DataTypes.STRING(256),
            allowNull: true,
            defaultValue: "",
            comment: "图片地址"
        },
        configs: {
            type: DataTypes.STRING(512),
            allowNull: true,
            defaultValue: "",
            comment: "校验"
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: "状态:1正常,0已删除"
        },
    }, {
        tableName: "image_code",
        freezeTableName: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        underscored: true,
        indexes: []
    });
}