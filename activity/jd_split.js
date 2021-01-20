/*
金榜年终奖
脚本会给内置的码进行助力
活动时间：2020-12-12日结束
活动入口：京东APP首页右边浮动飘窗
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#金榜年终奖
10 0 * * * https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_split.js, tag=年终奖, enabled=true

================Loon==============
[Script]
cron "10 0 * * *" script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_split.js,tag=年终奖

===============Surge=================
金榜年终奖 = type=cron,cronexp="10 0 * * *",wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_split.js

============小火箭=========
金榜年终奖 = type=cron,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_split.js, cronexpr="10 0 * * *", timeout=200, enable=true
 */
const $ = new Env('金榜年终奖');

const notify = $.isNode() ? require('../sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('../jdCookie.js') : '';
let jdNotify = true;//是否关闭通知，false打开通知推送，true关闭通知推送
const randomCount = $.isNode() ? 20 : 5;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  let cookiesData = $.getdata('CookiesJD') || "[]";
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map(item => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';
$.newShareCodes = ['P04z54XCjVUnIaW5m9cZ2Wt2C1Dw1YPyvwEMy8', 'P04z54XCjVUnIaW5m9cZx6-nA4z4VajB0qrqQ', 'P04z54XCjVUnIaW5m9cZ2b83Hwcx1gncuX6vYU'];
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      await TotalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }
      await jdSplit()
    }
  }
})()
    .catch((e) => {
      $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
      $.done();
    })
async function jdSplit() {
  await helpFriends();
  await jdsplit_getTaskDetail();
  await doTask();
  await showMsg();
}
function showMsg() {
  return new Promise(resolve => {
    message += `任务已做完：具体奖品去发活动页面查看\n活动入口：京东APP首页右边浮动飘窗`;
    $.msg($.name, '', `京东账号${$.index}${$.nickName}\n${message}`);
    resolve()
  })
}
async function helpFriends() {
  for (let code of $.newShareCodes) {
    if (!code) continue
    const helpRes = await jdsplit_collectScore(code,6,null);
    if (helpRes.code === 0 && helpRes.data.bizCode === -7) {
      console.log(`助力机会已耗尽，跳出`);
      break
    }
  }
}
async function doTask() {
  for (let item of $.taskVos) {
    if (item.taskType === 8) {
      //看看商品任务
      if (item.status === 1) {
        console.log(`准备做此任务：${item.taskName}`);
        for (let task of item.productInfoVos) {
          if (task.status === 1) {
            await jdsplit_collectScore(task.taskToken,item.taskId,task.itemId,1);
            await $.wait(4000)
            await jdsplit_collectScore(task.taskToken,item.taskId,task.itemId,0);
          }
        }
        await jdsplit_getLottery(item.taskId)
      } else if(item.status!==4){
        await jdsplit_getLottery(item.taskId)
        console.log(`${item.taskName}已做完`)
      }
    }
    if (item.taskType === 9) {
      //逛会场任务
      if (item.status === 1) {
        console.log(`准备做此任务：${item.taskName}`);
        for (let task of item.shoppingActivityVos) {
          if (task.status === 1) {
            await jdsplit_collectScore(task.taskToken,item.taskId,task.itemId,1);
            await $.wait(4000)
            await jdsplit_collectScore(task.taskToken,item.taskId,task.itemId,0);
          }
        }
        await jdsplit_getLottery(item.taskId)
      } else if(item.status!==4){
        await jdsplit_getLottery(item.taskId)
        console.log(`${item.taskName}已做完`)
      }
    }
  }
}

//领取做完任务的奖励
function jdsplit_collectScore(taskToken, taskId, itemId, actionType=0) {
  return new Promise(resolve => {
    let body = { "appId":"1EFRTwA","taskToken":taskToken,"taskId":taskId,"itemId":itemId,"actionType":actionType }
    $.post(taskPostUrl("harmony_collectScore", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if(data.data.bizCode === 1){
              console.log(`任务领取成功`);
            }
            else if (data.data.bizCode === 0) {
                if(data.data.result.taskType===6){
                  console.log(`助力好友：${data.data.result.itemId}成功！`)
                }else
                  console.log(`任务完成成功`);
            } else {
              console.log(`${data.data.bizMsg}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

// 抽奖
function jdsplit_getLottery(taskId) {
  return new Promise(resolve => {
    let body = { "appId":"1EFRTwA","taskId":taskId}
    $.post(taskPostUrl("splitHongbao_getLotteryResult", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.data.bizCode === 0) {
              console.log(`红包领取结果：${data.data.result.userAwardsCacheDto.redPacketVO.name}`);
            } else {
              console.log(JSON.stringify(data))
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function jdsplit_getTaskDetail() {
  return new Promise(resolve => {
    $.post(taskPostUrl("splitHongbao_getHomeData", {"appId":"1EFRTwA","taskToken":""}, ), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.data.bizCode === 0) {
              $.taskVos = data.data.result.taskVos;//任务列表
              $.taskVos.map(item => {
                if (item.taskType === 6) {
                  console.log(`\n您的${$.name}好友助力邀请码：${item.assistTaskDetailVo.taskToken}\n`)
                }
              })
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function taskPostUrl(function_id, body = {}, function_id2) {
  let url = `${JD_API_HOST}`;
  if (function_id2) {
    url += `?functionId=${function_id2}`;
  }
  return {
    url,
    body: `functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=9.1.0`,
    headers: {
      "Cookie": cookie,
      "origin": "https://h5.m.jd.com",
      "referer": "https://h5.m.jd.com/",
      'Content-Type': 'application/x-www-form-urlencoded',
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0"),
    }
  }
}
function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0")
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 13) {
              $.isLogin = false; //cookie过期
              return
            }
            $.nickName = data['base'].nickname;
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == "object") {
      return true;
    }
  } catch (e) {
    console.log(e);
    console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}
function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
      return [];
    }
  }
}
// prettier-ignore