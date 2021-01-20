/*
京东健康
京东健康APP集汪汪卡瓜分百万红包
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#京东健康
10 8 * * * https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_jdh.js, tag=京东健康, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jd_jdh.png, enabled=true

================Loon==============
[Script]
cron "10 8 * * *" script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_jdh.js,tag=京东健康

===============Surge=================
京东健康 = type=cron,cronexp="10 8 * * *",wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_jdh.js

============小火箭=========
京东健康 = type=cron,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_jdh.js, cronexpr="10 8 * * *", timeout=200, enable=true
 */
const $ = new Env('京东健康');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true;//是否关闭通知，false打开通知推送，true关闭通知推送
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
const JD_API_HOST = 'https://api.m.jd.com/api';
$.newShareCodes = [ '904b2a8c4db9a295e0f4b03d3d0b20cf', '1df932d56f10664e8689e825b266d9fd', '18affb09e18998e02b6480236944469b', 'c472c452619627fdf26b9d9d0365795b', 'a3528f35ab832cfe3f92019466eeec18' ];
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
      await jdJdh()
    }
  }
  // 帮助作者，把作者助力码放到用户助力码之后
  await getAuthorShareCode('https://gitee.com/shylocks/updateTeam/raw/main/jd_jdh.json');
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      await helpFriends()
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })
async function helpFriends(){
  for(let i = 0; i < $.newShareCodes.length; ++i){
    const res = await helpFriend($.newShareCodes[i])
    if (res['data'] && res['data']['inviteCode'] === 8){
      // 助力次数已满，跳出
      break
    }
  }
}
function rand(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
async function jdJdh() {
  await queryShareInfo()
  await queryInviteHome()
  $.nowCount = $.count
  let t = `${new Date().getUTCFullYear()}${new Date().getUTCMonth()+1}${new Date().getUTCDate()}`
  await queryTask(15,"meetingplace") // 逛义诊会场
  await queryTask(18,"2951198") // 看名医直播
  await queryTask(17,"246147") //
  await queryTask(24, t) // 辟谣
  await doTask(22,42,`${new Date().getUTCFullYear()}-${new Date().getUTCMonth()+1}-${new Date().getUTCDate()}`) // 去打卡
  await queryTask(20,"362451650500001") // 测一测
  await doTask(23,40,`${rand(10000, 20000)}`) // 走路，这个可以直接提示领奖结果
  // 以下两个需要开启家庭医生才能完成
  await doTask(null,50,`${rand(10000, 20000)}`) // 家庭医生走路
  await queryTask(17,"235741")  // 家庭医生资讯，这个可以不用开启直接完成
  await queryInviteHome()
  await showMsg()
}
function getAuthorShareCode(url) {
  return new Promise(resolve => {
    $.get({url: `${url}?${new Date()}`,
      headers:{
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88"
      }}, async (err, resp, data) => {
      try {
        if (err) {
        } else {
          $.newShareCodes = $.newShareCodes.concat(JSON.parse(data))
          console.log($.newShareCodes)
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
function queryShareInfo() {
  return new Promise(resolve => {
    $.get(taskUrl("jdh_invite_startInvite", {"channel":"jdhapp","m_patch_appid":"jdh"}), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(resp)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            console.log(`您的分享助力码为：${data.data.shareParam}`)
            $.newShareCodes.push(data.data.shareParam)
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
function queryInviteHome() {
  // 首次点击30张汪汪卡
  return new Promise(resolve => {
    $.get(taskUrl("jdh_invite_queryInviteHome", {"channel":"jdhapp","m_patch_appid":"jdh"}), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            $.count = data.data.ownerInfo.activityChanceCount
            if(data.data.ownerInfo.firstVisitChance){
              console.log(`首次访问成功，获得 ${data.data.ownerInfo.firstVisitChance}张汪汪卡`)
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
function helpFriend(code) {
  let body = {"channel":"jdhapp","m_patch_appid":"jdh","shareParam":code}
  return new Promise(resolve => {
    $.get(taskUrl("jdh_invite_inviteFriends", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if(data.code === 0){
              console.log(`助力好友 ${code} 结果：${data.data.inviteDesc}`)
            }
            else console.log(`助力好友 ${code} 失败，错误信息：${data.message}`)
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
function getTaskList() {
  let body = {"pageSize":15,"startFloor":1,"pageId":"c7c1fa16b8a94fbb97f6ec220488d01b"}
  return new Promise(resolve => {
    $.get(taskUrl("jdh_queryFloor", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(resp)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            // console.log(data)
            $.inviteInfo = data.data.floorDataList.filter(vo=>vo.name==="HD_Floor_Health_Month_CollectCard")[0]
            console.log($.inviteInfo)
            console.log(`当前助力进度：${$.inviteInfo.items[0].completeNum}/${$.inviteInfo.items[0].limitNum}`)
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
function queryTask(taskType,infoId) {
  let body = {"channel":"jdhapp","m_patch_appid":"jdh","taskType":taskType,"infoId":infoId}
  return new Promise(resolve => {
    $.get(taskUrl("jdh_task_queryTask", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if(data.data&&data.data.length>0)
              await doTask(taskType,data.data[0].id,infoId)
            else
              console.log(`任务已做过`)
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
function doTask(taskType,taskId,infoId) {
  let body = {"channel":"jdhapp","m_patch_appid":"jdh","taskId":taskId, "infoId":infoId}
  return new Promise(resolve => {
    $.get(taskUrl("jdh_task_doTask", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            console.log(data.message)
            // await rewardTask(taskType,taskId,infoId)
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
function doTask2(taskType,taskId,infoId) {
  let body = {"channel":"jdhapp","m_patch_appid":"jdh","taskId":taskId, "infoId":infoId}
  return new Promise(resolve => {
    $.get(taskUrl("jdh_task_doTask", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            console.log(data.message)
            // await rewardTask(taskType,taskId,infoId)
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
function rewardTask(taskType,taskId,infoId) {
  // 会报 no access 无解
  let body = {"channel":"jdhapp","m_patch_appid":"jdh",
    "taskId":taskId,"taskType":taskType,"infoId":infoId}
  return new Promise(resolve => {
    $.get(taskUrl("jdh_task_getReward", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            console.log(data)
            if (data.code ===0) {
              console.log(data.data.extResult.mainTitle)
            }else{
              console.log(data.data.msg)
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
async function showMsg() {
  message =  `获得${$.count - $.nowCount}张汪汪卡，共${$.count}张汪汪卡\n任务已做完，请手动领取奖励`
  if ($.isNode() && !jdNotify) {
    await notify.sendNotify(`【京东账号${$.index}】${$.nickName} `, `【${$.name}】${message}`);
  } else {
    $.log(`京东账号${$.index}${$.nickName}\n${message}`);
  }
}

function taskPostUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${function_id}`,
    body: body,
    headers: {
      "Cookie": cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'accept': 'application/json, text/plain, */*',
      'origin': 'https://hlc.m.jd.com',
      'referer': 'https://hlc.m.jd.com/Question_Answer_Rumour/answerComplete',
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : "jdhapp;iPhone;9.2.7;14.2;network/wifi;lang/zh_CN;model/iPhone10,2;appBuild/1206;pv/2.1;apprpd/;usc/;jdv/0|;umd/;psq/4;ucp/;app_device/IOS;utr/;ref/;adk/;ads/;Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1") : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdhapp;iPhone;9.2.7;14.2;network/wifi;lang/zh_CN;model/iPhone10,2;appBuild/1206;pv/2.1;apprpd/;usc/;jdv/0|;umd/;psq/4;ucp/;app_device/IOS;utr/;ref/;adk/;ads/;Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
    }
  }
}
function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&appid=JDHAPP&clientVersion=2.1.7&body=${escape(JSON.stringify(body))}`,
    headers: {
      "Cookie": cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'accept': 'application/json, text/plain, */*',
      'origin': 'https://hlc.m.jd.com',
      'referer': 'https://hlc.m.jd.com/Question_Answer_Rumour/answerComplete',
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : "jdhapp;iPhone;9.2.7;14.2;network/wifi;lang/zh_CN;model/iPhone10,2;appBuild/1206;pv/2.1;apprpd/;usc/;jdv/0|;umd/;psq/4;ucp/;app_device/IOS;utr/;ref/;adk/;ads/;Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1") : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdhapp;iPhone;9.2.7;14.2;network/wifi;lang/zh_CN;model/iPhone10,2;appBuild/1206;pv/2.1;apprpd/;usc/;jdv/0|;umd/;psq/4;ucp/;app_device/IOS;utr/;ref/;adk/;ads/;Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
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
      $.msg($.name, '', '不要在BoxJS手动复制粘贴修改cookie')
      return [];
    }
  }
}
// prettier-ignore