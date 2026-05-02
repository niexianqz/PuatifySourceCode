// ==========================================
// ⚙️ CONFIGURATION: Set your credentials here
// ==========================================

// 1. Admin Login settings (for accessing the web dashboard)
const ADMIN_USER = "Admin";
const ADMIN_PASS = "1234";

// 2. Security: Change this to a strong, unguessable string (used for Next.js connection)
const AUTH_TOKEN = "YOUR_SECRET_AUTH_TOKEN_HERE"; 

// 3. Insert your LINE Channel Access Token here (from LINE Developers Console)
const LINE_TOKEN = "YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE"; 

// ==========================================

// Initialize or retrieve the database from PropertiesService
function getDatabase() {
  const props = PropertiesService.getScriptProperties();
  const dataString = props.getProperty('PUATIFY_DB');
  if (dataString) return JSON.parse(dataString);
  return { images: {}, subjects: {}, subscribers: {} };
}

// Save data back to PropertiesService
function saveDatabase(data) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('PUATIFY_DB', JSON.stringify(data));
}

// Handle GET requests (Returns JSON database)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify(getDatabase())).setMimeType(ContentService.MimeType.JSON);
}

// Handle POST requests (LINE Webhooks and Admin API)
function doPost(e) {
  let requestData;
  try {
    requestData = JSON.parse(e.postData.contents);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error' })).setMimeType(ContentService.MimeType.JSON);
  }

  // Route to LINE Webhook handler if events exist
  if (requestData.events && requestData.events.length > 0) {
    handleLineWebhook(requestData);
    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
  }

  const action = requestData.action;

  // Admin Login Authentication
  if (action === 'login') {
    if (requestData.username === ADMIN_USER && requestData.password === ADMIN_PASS) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', token: AUTH_TOKEN })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unauthorized' })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Save Schedule Entry
  if (action === 'save_entry' && requestData.token === AUTH_TOKEN) {
    const db = getDatabase();
    const key = requestData.level + '_' + requestData.room;
    if (!db.images) db.images = {};
    if (!db.subjects) db.subjects = {};
    if (!db.subjects[key]) db.subjects[key] = {};
    if (!db.subjects[key][requestData.day]) db.subjects[key][requestData.day] = {};

    db.images[key] = requestData.imageUrl;
    db.subjects[key][requestData.day][String(requestData.period)] = {
      name: requestData.subjectName,
      teacher: requestData.teacherName
    };
    saveDatabase(db);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  }

  // Delete Schedule Entry
  if (action === 'delete_entry' && requestData.token === AUTH_TOKEN) {
    const db = getDatabase();
    const key = requestData.level + '_' + requestData.room;
    if (db.subjects?.[key]?.[requestData.day]?.[String(requestData.period)]) {
      delete db.subjects[key][requestData.day][String(requestData.period)];
      saveDatabase(db);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  }

  // Test Notification Line
  if (action === 'test_line' && requestData.token === AUTH_TOKEN) {
    const db = getDatabase();
    const key = `${requestData.level}_${requestData.room}`;
    const day = requestData.day;
    if (!db.subjects) db.subjects = {};

    const now = new Date();
    const thaiTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[thaiTime.getDay()];
    const currentMinutes = thaiTime.getHours() * 60 + thaiTime.getMinutes();
    
    let testMinutes = (day === currentDay) ? currentMinutes : undefined;
    const scheduleList = buildScheduleListForNotification(db, key, day, testMinutes);
    
    let dayThai = day === 'Monday' ? 'จันทร์' : day === 'Tuesday' ? 'อังคาร' : day === 'Wednesday' ? 'พุธ' : day === 'Thursday' ? 'พฤหัสบดี' : day === 'Friday' ? 'ศุกร์' : day === 'Saturday' ? 'เสาร์' : 'อาทิตย์';
    const title = `ตารางเรียนวัน${dayThai} ม.${requestData.level.replace('m', '')}/${requestData.room}`;
    const flex = buildFlexMessage(title, scheduleList); 
    
    const subscribers = db.subscribers && db.subscribers[key] ? db.subscribers[key] : [];
    if (subscribers.length > 0) {
      sendLineMulticast(subscribers, flex);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
}

// Process incoming LINE messages
function handleLineWebhook(data) {
  const db = getDatabase();
  data.events.forEach(event => {
    const userId = event.source.userId;
    
    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text.trim().toUpperCase();
      
      // User requested schedule summary
      if (text === 'เช็คตารางเรียน' || text === 'เช็ค' || text === 'สรุป' || text === 'ตารางของฉัน' || text === 'เทส' || text === 'TEST') {
        let followedKeys = [];
        for (let r in db.subscribers) { 
            if (db.subscribers[r].includes(userId)) { followedKeys.push(r); } 
        }

        // Remove duplicate subscriptions
        followedKeys = [...new Set(followedKeys)];

        if (followedKeys.length > 0) {
          const now = new Date();
          const thaiTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
          const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const currentDay = days[thaiTime.getDay()];
          const currentMinutes = thaiTime.getHours() * 60 + thaiTime.getMinutes();
          let dayThai = currentDay === 'Monday' ? 'จันทร์' : currentDay === 'Tuesday' ? 'อังคาร' : currentDay === 'Wednesday' ? 'พุธ' : currentDay === 'Thursday' ? 'พฤหัสบดี' : currentDay === 'Friday' ? 'ศุกร์' : currentDay === 'Saturday' ? 'เสาร์' : 'อาทิตย์';

          let bubbles = [];
          
          followedKeys.slice(0, 10).forEach(key => {
            const scheduleList = buildScheduleListForNotification(db, key, currentDay, currentMinutes);
            bubbles.push(buildFlexMessage(`ตารางเรียนวัน${dayThai} ม.${key.replace('m', '').replace('_', '/')}`, scheduleList));
          });

          let flexContent = bubbles.length === 1 ? bubbles[0] : { "type": "carousel", "contents": bubbles };

          UrlFetchApp.fetch("https://api.line.me/v2/bot/message/reply", {
            "method": "post", "contentType": "application/json", "headers": { "Authorization": "Bearer " + LINE_TOKEN },
            "payload": JSON.stringify({ "replyToken": event.replyToken, "messages": [{ "type": "flex", "altText": "สถานะตารางเรียน", "contents": flexContent }] })
          });
        } else {
           replyMenuAndText(event.replyToken, userId, db, "คุณยังไม่ได้ติดตามห้องเรียนใดเลยครับ กรุณาเลือกห้องที่เมนูด้านล่างนี้");
        }
      } 
      // User requested the menu
      else if (text === 'ตารางเรียน' || text === 'เมนู' || text === 'ลงทะเบียน' || text === 'MENU') {
          replyMenuAndText(event.replyToken, userId, db, null);
      }
    } 
    // Handle postback actions (Room toggle)
    else if (event.type === 'postback') {
       const postbackData = event.postback.data;
       if (postbackData.startsWith('toggle_')) {
          const targetKey = postbackData.replace('toggle_', '');
          if (!db.subscribers) db.subscribers = {};
          if (!db.subscribers[targetKey]) db.subscribers[targetKey] = [];
          
          const userIndex = db.subscribers[targetKey].indexOf(userId);
          let replyMsg = "";
          
          if (userIndex > -1) {
              db.subscribers[targetKey].splice(userIndex, 1);
              replyMsg = `ยกเลิกการติดตามตารางเรียนชั้น ม.${targetKey.replace('m','').replace('_','/')} เรียบร้อยแล้วครับ`;
          } else {
              db.subscribers[targetKey].push(userId);
              replyMsg = `รับทราบ เพิ่มการติดตามตารางเรียนชั้น ม.${targetKey.replace('m','').replace('_','/')} เรียบร้อย พิมพ์ "เช็คตารางเรียน" เพื่อดูตารางได้เลยครับ`;
          }
          
          saveDatabase(db);
          replyMenuAndText(event.replyToken, userId, db, replyMsg);
       }
    }
  });
}

// Helper to structure schedule data based on current time
function buildScheduleListForNotification(db, key, day, currentMinutes) {
  const todaySubjects = db.subjects[key]?.[day] || {};
  const isJunior = key.startsWith('m1') || key.startsWith('m2') || key.startsWith('m3');
  const sequence = isJunior ? [1, 2, 3, "LUNCH", 4, 5, 6, 7, 8] : [1, 2, 3, 4, "LUNCH", 5, 6, 7, 8];
  
  const getSlot = (p) => {
    if (p === "LUNCH") {
        return isJunior 
          ? { start: 11 * 60 + 0, end: 11 * 60 + 50, timeStr: "11:00 - 11:50" }
          : { start: 11 * 60 + 50, end: 12 * 60 + 40, timeStr: "11:50 - 12:40" };
    }
    const slots = {
      "1": { start: 8 * 60 + 30, end: 9 * 60 + 20, timeStr: "08:30 - 09:20" },
      "2": { start: 9 * 60 + 20, end: 10 * 60 + 10, timeStr: "09:20 - 10:10" },
      "3": { start: 10 * 60 + 10, end: 11 * 60 + 0, timeStr: "10:10 - 11:00" },
      "4": isJunior ? { start: 11 * 60 + 50, end: 12 * 60 + 40, timeStr: "11:50 - 12:40" } : { start: 11 * 60 + 0, end: 11 * 60 + 50, timeStr: "11:00 - 11:50" },
      "5": { start: 12 * 60 + 40, end: 13 * 60 + 30, timeStr: "12:40 - 13:30" },
      "6": { start: 13 * 60 + 30, end: 14 * 60 + 20, timeStr: "13:30 - 14:20" },
      "7": { start: 14 * 60 + 20, end: 15 * 60 + 10, timeStr: "14:20 - 15:10" },
      "8": { start: 15 * 60 + 10, end: 16 * 60 + 0, timeStr: "15:10 - 16:00" }
    };
    return slots[String(p)];
  };

  let list = [];
  sequence.forEach((p) => {
    const slot = getSlot(p);
    let status = 'pending'; // Indicates upcoming class
    if (currentMinutes !== undefined) {
        if (currentMinutes >= slot.end) status = 'finished';
        else if (currentMinutes >= slot.start && currentMinutes < slot.end) status = 'active'; // Indicates current class
    }

    if (p === "LUNCH" && Object.keys(todaySubjects).length > 3) {
      list.push({ 
        type: status === 'active' ? 'active' : 'lunch', 
        label: status === 'active' ? 'พักเที่ยง (NOW)' : status === 'finished' ? 'พักเที่ยง (ผ่านไปแล้ว)' : 'พักเที่ยง', 
        text: `พักรับประทานอาหาร`,
        time: slot.timeStr,
        color: status === 'finished' ? '#64748B' : '#F9A8D4',
        textColor: status === 'finished' ? '#94A3B8' : '#FFFFFF'
      });
    } else if (todaySubjects[String(p)]) {
      const subName = todaySubjects[String(p)].name;
      const subTeacher = todaySubjects[String(p)].teacher;
      list.push({ 
        type: status, 
        label: status === 'active' ? 'กำลังเรียน' : status === 'finished' ? 'เรียนเสร็จแล้ว' : `คาบ ${p}`, 
        text: `${subName} (ครู${subTeacher})`,
        time: slot.timeStr,
        color: status === 'active' ? '#6EE7B7' : status === 'finished' ? '#64748B' : '#C4B5FD',
        textColor: status === 'finished' ? '#94A3B8' : '#FFFFFF'
      });
    }
  });
  return list;
}

// Generate the selection menu carousel
function replyMenuAndText(replyToken, userId, db, extraText) {
  const bubbles = [];
  let followedKeys = [];
  for (let r in db.subscribers) { 
      if (db.subscribers[r].includes(userId)) { followedKeys.push(r); } 
  }

  for (let g = 1; g <= 6; g++) {
    const rows = [];
    const maxRooms = (g <= 3) ? 9 : 8;
    let roomNum = 1;
    while (roomNum <= maxRooms) {
      const buttons = [];
      for (let c = 0; c < 3; c++) {
        if (roomNum <= maxRooms) {
          let roomKey = `m${g}_${roomNum}`;
          let isFollowed = followedKeys.includes(roomKey);

          buttons.push({
            "type": "button", "style": "primary", "height": "sm",
            "color": isFollowed ? "#A855F7" : "#2E1065",
            "action": { "type": "postback", "label": `ม.${g}/${roomNum}`, "data": `toggle_${roomKey}` }
          });
          roomNum++;
        }
      }
      rows.push({ "type": "box", "layout": "horizontal", "spacing": "md", "margin": "md", "contents": buttons });
    }
    bubbles.push({
      "type": "bubble", "size": "kilo",
      "header": { "type": "box", "layout": "vertical", "backgroundColor": "#7E22CE", "contents": [{ "type": "text", "text": `มัธยมศึกษาปีที่ ${g}`, "color": "#FFFFFF", "weight": "bold", "align": "center" }] },
      "body": { "type": "box", "layout": "vertical", "backgroundColor": "#4C1D95", "contents": rows }
    });
  }
  const messages = [];
  if (extraText) messages.push({ "type": "text", "text": extraText });
  messages.push({ "type": "flex", "altText": "เลือกห้องเรียนเพื่อติดตามตารางเรียน", "contents": { "type": "carousel", "contents": bubbles } });
  UrlFetchApp.fetch("https://api.line.me/v2/bot/message/reply", {
    "method": "post", "contentType": "application/json", "headers": { "Authorization": "Bearer " + LINE_TOKEN },
    "payload": JSON.stringify({ "replyToken": replyToken, "messages": messages })
  });
}

// Multicast logic for manual triggers
function sendLineMulticast(userIds, flexContent) {
  if (!userIds || userIds.length === 0) return;
  const chunks = [];
  for (let i = 0; i < userIds.length; i += 500) { chunks.push(userIds.slice(i, i + 500)); }
  chunks.forEach(chunk => {
    UrlFetchApp.fetch("https://api.line.me/v2/bot/message/multicast", {
      "method": "post", "contentType": "application/json", "headers": { "Authorization": "Bearer " + LINE_TOKEN },
      "payload": JSON.stringify({ "to": chunk, "messages": [{ "type": "flex", "altText": "อัปเดตตารางเรียน", "contents": flexContent }] })
    });
  });
}

// Construct Flex Message JSON
function buildFlexMessage(title, scheduleList) {
  const contents = [];
  scheduleList.forEach((item, index) => {
    contents.push({
      "type": "box", "layout": "vertical", "margin": index === 0 ? "none" : "lg",
      "contents": [
        {
          "type": "box", "layout": "horizontal", "contents": [
            { "type": "text", "text": `[ ${item.label} ]`, "color": item.color, "size": "xs", "weight": "bold", "flex": 1 },
            { "type": "text", "text": item.time, "color": "#94A3B8", "size": "xxs", "weight": "bold", "align": "end", "flex": 0 }
          ]
        },
        { "type": "text", "text": item.text, "color": item.textColor, "size": "sm", "wrap": true, "margin": "sm" }
      ]
    });
    if (index < scheduleList.length - 1) {
      contents.push({ "type": "separator", "color": "#1E293B", "margin": "lg" });
    }
  });

  return {
    "type": "bubble", "size": "mega",
    "header": { "type": "box", "layout": "vertical", "backgroundColor": "#0B1120", "contents": [{ "type": "text", "text": title, "color": "#D8B4FE", "weight": "bold", "size": "lg" }] },
    "body": { "type": "box", "layout": "vertical", "backgroundColor": "#0F172A", "contents": contents }
  };
}