var c = document.getElementById("clock");
var ctx = c.getContext("2d");
var x = 125
var y = 125
var r = 100
var lat, lon, sunriseStr, sunsetStr

async function initLoc() {
	const res = await fetch('https://location.services.mozilla.com/v1/geolocate?key=test').then(el => el.json())
	return [res.location.lat, res.location.lng]
}

function strToTime(timeStr) {
	var time = timeStr.split(' ')
	var timeArr = time[0].split(':')
	var h = timeArr[0]
	var m = timeArr[1]
	var s = timeArr[2]
	var h12 = time[1]

	if (h12 == 'PM') {
		h += 12
	}

	var timeRet = new Date()
	timeRet.setHours(h)
	timeRet.setMinutes(m)
	timeRet.setSeconds(s)

	return timeRet
}

function toTimeAbs(time) {
	return time.getHours() / 24 + time.getMinutes() / (60 * 24) + time.getSeconds() / (60 * 60 * 24) + time.getMilliseconds() / (1000 * 60 * 60 * 24)
}

function toRelShort(timeAbs) {
	return Math.floor(timeAbs * 100) + 'r' + Math.floor(timeAbs * 10000) % 100 + 'p'
}

function toTimeShort(time) {
	return time.getHours() + 'h' + time.getMinutes() + 'm'
}

function initClock() {
	ctx.font = "14px Ubuntu";
	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2 * Math.PI);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(x, y, r * 1.2, 0, 2 * Math.PI);
	ctx.stroke();
	ctx.save();
	for (let i = 0; i < 100; i++) {
		ctx.beginPath();
		if (i % 10 == 0) {
			if (i == 0)
				ctx.fillText(100, x - 12 + 1.1 * r * Math.cos(2 * Math.PI * i / 100 - Math.PI / 2), y + 5 + 1.1 * r * Math.sin(2 * Math.PI * i / 100 - Math.PI / 2));
			else
				ctx.fillText(i, x - 8 + 1.1 * r * Math.cos(2 * Math.PI * i / 100 - Math.PI / 2), y + 5 + 1.1 * r * Math.sin(2 * Math.PI * i / 100 - Math.PI / 2));
			ctx.moveTo(x + 0.9 * r * Math.cos(2 * Math.PI * i / 100 - Math.PI / 2), y + 0.9 * r * Math.sin(2 * Math.PI * i / 100 - Math.PI / 2));
		} else
			ctx.moveTo(x + 0.95 * r * Math.cos(2 * Math.PI * i / 100 - Math.PI / 2), y + 0.95 * r * Math.sin(2 * Math.PI * i / 100 - Math.PI / 2));
		ctx.lineTo(x + r * Math.cos(2 * Math.PI * i / 100 - Math.PI / 2), y + r * Math.sin(2 * Math.PI * i / 100 - Math.PI / 2));
		ctx.stroke();
	}
}

function animateHands(rels, relPrimers, relSeconds, relTertiaries) {
	ctx.beginPath();
	ctx.arc(x, y, 0.89 * r, 0, 2 * Math.PI);
	ctx.clip();
	ctx.clearRect(0, 0, 250, 250);
	ctx.beginPath();
	ctx.lineWidth = 2
	ctx.moveTo(x, y);
	ctx.lineTo(x + 0.4 * r * Math.cos(2 * Math.PI * (rels / 100 + relPrimers / 10000) - Math.PI / 2), y + 0.4 * r * Math.sin(2 * Math.PI * (rels / 100 + relPrimers / 10000) - Math.PI / 2));
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x + 0.6 * r * Math.cos(2 * Math.PI * (relPrimers / 100 + relSeconds / 10000) - Math.PI / 2), y + 0.6 * r * Math.sin(2 * Math.PI * (relPrimers / 100 + relSeconds / 10000) - Math.PI / 2));
	ctx.stroke();
	ctx.beginPath();
	ctx.lineWidth = 1
	ctx.strokeStyle = "#FF0000";
	ctx.moveTo(x, y);
	ctx.lineTo(x + 0.85 * r * Math.cos(2 * Math.PI * (relSeconds / 100 + relTertiaries / 10000) - Math.PI / 2), y + 0.85 * r * Math.sin(2 * Math.PI * (relSeconds / 100 + relTertiaries / 10000) - Math.PI / 2));
	ctx.stroke();
	ctx.beginPath();
	ctx.lineWidth = 4
	ctx.strokeStyle = "#000000";
	ctx.arc(x, y, 0.02 * r, 0, 2 * Math.PI);
	ctx.stroke();
}

async function prepareSunReq() {
	var loc = await initLoc()
	lat = loc[0]
	lon = loc[1]
	document.querySelector('#local').innerHTML = 'Calculated from your approximate location:<br>' +
		lat + ', ' + lon
	makeSunReq()
}

function makeSunReq() {
	var requestSun = new XMLHttpRequest()
	requestSun.open('GET', 'https://api.sunrise-sunset.org/json?lat=' + lat + '&lng=' + lon, true)

	requestSun.onload = function () {
		var data = JSON.parse(this.response)
		sunriseStr = data['results']['sunrise']
		sunsetStr = data['results']['sunset']
		console.log(data)

		var sunrise = strToTime(sunriseStr)
		var sunriseAbs = toTimeAbs(sunrise)
		var sunset = strToTime(sunsetStr)
		var sunsetAbs = toTimeAbs(sunset)
		document.querySelector('#sun').innerHTML = 'Sunrise: 00r00p (' + toTimeShort(sunrise) + ')<br>Sunset: ' + toRelShort(sunsetAbs - sunriseAbs) + ' (' + toTimeShort(sunset) + ')'
		setInterval(function () {
			var now = new Date()
			var nowAbs = toTimeAbs(now)
			var nowRel = nowAbs - sunriseAbs
			if (nowRel < 0)
				nowRel += 1
			rels = Math.floor(nowRel * 100)
			relPrimers = Math.floor(nowRel * 10000) % 100
			relSeconds = Math.floor(nowRel * 1000000) % 100
			relTertiaries = Math.floor(nowRel * 100000000) % 100
			animateHands(rels, relPrimers, relSeconds, relTertiaries)
			document.querySelector('#rels').innerHTML = rels + ' rels, ' + relPrimers + ' primers, ' + relSeconds + ' seconds'
			//console.log(nowRel)
		}, 10);
	}
	requestSun.send()
}

initClock()
prepareSunReq()