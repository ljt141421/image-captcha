/**
 * 图形验证码服务类
 */
const { createCanvas, loadImage, registerFont } = require('canvas');
const { ImageCode } = require('../models/activitycenter');
const FileUpload = require('../common/upload');
const logger = require('../common/logger')('ImageCaptchaService');

class ImageCaptchaService {
    constructor() {
    }

    async generateImageCaptcha(params) {
        // canvasWidth: 图形验证码的长度，默认500px
        // canvasHeight: 图形验证码的高度，默认250px
        // numCharacters: 验证码字符总数，默认4个
        // requiredCharacters: 需要点击的字符数量，默认2个
        // fond_color: 字体颜色字符串，以英文状态下的,分割，需要与验证码字符总数保持一直，默认使用系统设置的颜色，
        // fond_size: 字体大小，默认50px
        // requiredCharacters: 需要点击的字符数量
        // image_url: 图片地址，图片大小需与图形验证码的长宽一致
        let { canvasWidth = 500, canvasHeight = 250, numCharacters = 4, fond_color = '', fond_size = 50, requiredCharacters = 2, generate_num = 1, image_url = '' } = params;
        let res_arr = [];

        //创建canvas
        const canvas = createCanvas(canvasWidth, canvasHeight);
        //加载字体
        registerFont('microsoft.ttf', { family: "Microsoft YaHei" });
        const vas = canvas.getContext('2d');
        //加载背景图
        if (!image_url) {
            image_url = './source_images/bak_5.png';
        }
        const back_image = await loadImage(image_url);
        vas.drawImage(back_image, 0, 0, canvasWidth, canvasHeight);

        // 生成验证码字符和坐标
        for (let i = 0; i < generate_num; i++) {
            let captchaData = this.generateCaptchaData(numCharacters, requiredCharacters, canvasWidth, canvasHeight);
            captchaData = captchaData.sort((x, y) => x.index - y.index);

            // 绘制字符到画布上, 字体颜色按需调整
            let fond_arr = ['#FF0000', '#0000EE', '#E066FF', '#000000'];
            if (fond_color) {
                fond_arr = fond_color.split(',');
            }
            //绘制字符
            for (let i = 0; i < numCharacters; i++) {
                const character = captchaData[i].character;
                const x = captchaData[i].x;
                const y = captchaData[i].y;
                vas.font = `${fond_size}px Microsoft YaHei`
                vas.fillStyle = fond_arr[i];
                vas.textAlign = 'center';
                vas.textBaseline = 'middle';
                vas.fillText(character, x, y);
            }

            //TODO 存储正确答案和字符坐标在会话中, 这里直接将验证码入库，然后使用的使用提前将相关数据预热到缓存中
            const server_correct_data = captchaData.slice(0, requiredCharacters);
            logger.info('server_correct_data: ', server_correct_data);

            // 将验证码图像发送到前端
            // ctx.type="image/png";
            // ctx.body =canvas.toBuffer('image/png');

            const buffer = canvas.toBuffer("image/png");
            let url = await FileUpload.upload(buffer);

            server_correct_data.forEach(item => {
                item.x = item.x.toFixed(2);
                item.y = item.y.toFixed(2);
            });

            //验证码入库
            await ImageCode.create({
                url:url,
                configs:JSON.stringify(server_correct_data)
            });

            res_arr.push({
                image_url: url,
                captchaData: server_correct_data
            });
        }
        return res_arr;
    }

    /**
     * 验证用户提交的验证码数据
     * user_answer_data: 用户提交的验证码数据，前端提交
     * user_captcha: 用户之前存储的验证码数据，一般存储中缓存中
     * 这两个数据格式为：可以按需调整
     * [
     *  {
     *      x: 0,
     *      y: 0,
     *      index: 0,
     *      character: 'A'
     *  },
     *  {
     *      x: 0,
     *      y: 0,
     *      index: 1,
     *      character: 'B'
     *   }
     * ]
     * @param user_answer_data
     * @param error_offset: 偏移量即点击文字的偏差大小，一般为图形验证码中字符的大小的一半 + 前端页面点击轮廓大小的一半
     * @returns {Promise<{message: (string), status: (number)}|{message: string, status: number}>}
     */
    async verifyImageCaptcha(user_answer_data, error_offset = 50) {
        let user_captcha = [];
        if (!user_captcha || user_captcha.length < 2) return { status: 1, message: "用户验证码数据为空，请重新生成验证码！" };
        user_captcha.forEach(item => {
            item.x = Number(item.x);
            item.y = Number(item.y);
        });

        let flag = this.validateDataStructure(user_answer_data, user_captcha, error_offset);
        //无论验证成功与否，都要删除用户的验证码数据
        //await redis.del(user_captcha_key);
        return { status: flag ? 0 : 1, message: flag ? "验证成功！" : "验证失败！" };

    }

    generateCaptchaData(totalCharacters, requiredCharacters, canvasWidth, canvasHeight) {
        //字体可以根据具体需要更改
        const characters = new Set(`壹贰叁肆伍陆柒捌玖拾佰仟万亿山水木火土天云风花鸟鱼星月石雨雪岛河湖海沙福善爱和喜乐琴棋书画让应直字场平报放至张认接笑内带边风叫任金快原象数战远格士音轻目完今提求王化空业思怎钱吗曾离飞干流欢即反题必该终林请晚制球决读运及则房早院量品近坐产答星`);
        const captchaData = [];

        //定义字符高度和宽度
        const characterWidth = 30;
        const characterHeight = 30;

        //定义字符之间的最小间距
        const miniCharacterSpacing = 30;
        //边框内边距
        const borderPadding = 50;

        // 生成需要点击的字符
        const selectedCharacters = new Set();
        for (let i = 0; i < requiredCharacters; i++) {
            const randomIndex = Math.floor(Math.random() * characters.size);
            const character = [...characters][randomIndex];
            selectedCharacters.add(character);
            characters.delete(character);
        }

        //生成验证码字符
        for (let i = 0; i < totalCharacters; i++) {
            const character = selectedCharacters.has(i) ? [...selectedCharacters][i] : this.generateRandomCharacter(characters);
            // 随机生成字符的坐标，确保不重叠
            let x, y;
            do {
                x = Math.random() * (canvasWidth );
                y = Math.random() * (canvasHeight );
                if (x < borderPadding) x += borderPadding;
                if (y < borderPadding) y += borderPadding;
                if (x > canvasWidth - borderPadding) x -= borderPadding;
                if (y > canvasHeight -borderPadding) y -= borderPadding;
            } while (this.isOverlap(captchaData, x, y, characterWidth, characterHeight, miniCharacterSpacing));
            captchaData.push({ character, x, y, index: i });
        }
        return captchaData;
    }

    //生成随机的非点击字符
    generateRandomCharacter(characters) {
        const characterArray = [...characters];
        const randomIndex = Math.floor(Math.random() * characterArray.length);
        const randomCharacter = characterArray[randomIndex];
        characters.delete(randomCharacter);
        return randomCharacter;
    }

    //检测字符是否重叠
    isOverlap(existingData, x, y, width, height, miniSpacing) {
        for (const data of existingData) {
            let x1 = data.x;
            let y1 = data.y;
            //检测两个字符是否重叠
            if (
                x + width > x1 - miniSpacing &&
                x < x1 + width + miniSpacing &&
                y + height > y1 - miniSpacing &&
                y < y1 + height + miniSpacing
            ) {
                return true; //重叠
            }
        }
        return false; //未重叠
    }

    // 检查数据结构A是否在数据结构B的范围内
    validateDataStructure(A, B, radius) {
        if (A.length !== B.length) {
            return false; // A和B的长度必须相同
        }

        for (let i = 0; i < A.length; i++) {
            const pointA = A[i];
            const pointB = B[i];

            const distance = this.calculateDistance(pointA.x, pointA.y, pointB.x, pointB.y);
            logger.info(`distance_${i}_${distance}`);
            if (distance > radius || pointA.character !== pointB.character) {
                return false; // 如果距离大于半径或字符不相等，校验失败
            }
        }
        return true; // 所有点都在范围内，校验成功
    }

    // 计算两点之间的距离
    calculateDistance(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }


}

module.exports = new ImageCaptchaService();