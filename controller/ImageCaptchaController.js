const router = require('koa-router')();
const { createCanvas, loadImage, registerFont } = require('canvas');
const { ImageCode } = require('../models/activitycenter');
const FileUpload = require('../common/upload');

/// 生成验证码时，记录字符和坐标
router.get('/generate-captcha', async(ctx, next) => {
    const canvasWidth = 500;
    const canvasHeight = 250;
    const numCharacters = 4; // 验证码字符总数
    const requiredCharacters = 2; // 需要点击的字符数量

    const canvas = createCanvas(canvasWidth, canvasHeight);
    registerFont('microsoft.ttf', { family: "Microsoft YaHei" });
    const vas = canvas.getContext('2d');

    const imge = await loadImage('./source_images/bak_5.png');
    vas.drawImage(imge, 0, 0, canvasWidth, canvasHeight);

    // 生成验证码字符和坐标
    let captchaData = generateCaptchaData(numCharacters, requiredCharacters, canvasWidth, canvasHeight);
    captchaData = captchaData.sort((x, y) => x.index - y.index);

    // 绘制字符到画布上
    const fond_arr = ['#FF0000', '#0000EE', '#E066FF', '#000000']
    for (let i = 0; i < numCharacters; i++) {
        const character = captchaData[i].character;
        const x = captchaData[i].x;
        const y = captchaData[i].y;
        vas.font = '50px Microsoft YaHei'
        vas.fillStyle = fond_arr[i];
        vas.textAlign = 'center';
        vas.textBaseline = 'middle';
        vas.fillText(character, x, y);
    }

    // 存储正确答案和字符坐标在会话中
    const server_correct_data = captchaData.slice(0, requiredCharacters);
    console.log('server_correct_data: ', server_correct_data);


    // res.type('json').send(JSON.stringify({
    //   image: canvas.toBuffer(),
    //   captchaData: captchaData
    // }));


    // 将验证码图像发送到前端
    // ctx.type="image/png";
    // ctx.body =canvas.toBuffer('image/png');

    const buffer = canvas.toBuffer("image/png");
    let url = await FileUpload.upload(buffer);

    server_correct_data.forEach(item => {
        item.x = item.x.toFixed(2);
        item.y = item.y.toFixed(2);
    });

    await ImageCode.create({
        url:url,
        configs:JSON.stringify(server_correct_data)
    });
    
    //返回给前端时去掉字符的坐标
    // server_correct_data.forEach(item => {
    //     delete item.x;
    //     delete item.y;
    // });

    ctx.body ={
        image_url: url,
        server_correct_data: server_correct_data
    };

});

// 验证用户提交的答案和坐标
router.get('/verify-captcha', (ctx, next) => {
    const userAnswers = req.query.answers; // 用户提交的答案
    const correctData = req.session.captcha; // 从会话中获取正确答案和坐标

    if (userAnswers && correctData) {
        if (isCorrectAnswers(userAnswers, correctData)) {
            res.send('验证码验证通过');
        } else {
            res.send('验证码验证失败');
        }
    } else {
        res.send('验证码验证失败');
    }
});

function generateCaptchaData(totalCharacters, requiredCharacters, canvasWidth, canvasHeight) {
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
        const character = selectedCharacters.has(i) ? [...selectedCharacters][i] : generateRandomCharacter(characters);
        // 随机生成字符的坐标，确保不重叠
        let x, y;
        do {
            x = Math.random() * (canvasWidth );
            y = Math.random() * (canvasHeight );
            if (x < borderPadding) x += borderPadding;
            if (y < borderPadding) y += borderPadding;
            if (x > canvasWidth - borderPadding) x -= borderPadding;
            if (y > canvasHeight -borderPadding) y -= borderPadding;
        } while (isOverlap(captchaData, x, y, characterWidth, characterHeight, miniCharacterSpacing));
        captchaData.push({ character, x, y, index: i });
    }
    return captchaData;
}

//生成随机的非点击字符
function generateRandomCharacter(characters) {
    const characterArray = [...characters];
    const randomIndex = Math.floor(Math.random() * characterArray.length);
    const randomCharacter = characterArray[randomIndex];
    characters.delete(randomCharacter);
    return randomCharacter;
}

//检测字符是否重叠
function isOverlap(existingData, x, y, width, height, miniSpacing) {
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

function isCorrectAnswers(userAnswers, correctData) {
    if (userAnswers.length !== correctData.length) {
        return false;
    }

    for (let i = 0; i < userAnswers.length; i++) {
        if (userAnswers[i].character !== correctData[i].character ||
            userAnswers[i].x !== correctData[i].x ||
            userAnswers[i].y !== correctData[i].y) {
            return false;
        }
    }
    return true;
}

module.exports = router