const imageCaptchaService = require('../service/ImageCaptchaService');
const assert = require("assert");

/**
 * 生成图形验证码
 * @type {{path: string, handler: (function(*): Promise<*>), method: string}}
 */
exports.generate_image_captcha = {
    path: "/generate/image/captcha",
    method: "post",
    handler: async (ctx)=> {
        let params = ctx.request.body;
        let res = await imageCaptchaService.generateImageCaptcha(params);
        return ctx.json(res);
    }
}

/**
 * 校验验证码
 * @type {{path: string, handler: ((function(*): Promise<*>)|*), method: string}}
 */
exports.verify_image_captcha = {
    path: "/verify/image/captcha",
    method: "post",
    handler: async (ctx)=> {
        let params = ctx.request.body;
        let { user_answer_data } = params;

        assert(user_answer_data, "用户提交的答案不能为空");
        user_answer_data = JSON.parse(user_answer_data);
        assert(user_answer_data.length > 0, "用户提交的答案不能为空");
        ctx.body = await imageCaptchaService.verifyImageCaptcha(user_answer_data);
    }
}