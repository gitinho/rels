var c = document.getElementById("clock");
var ctx = c.getContext("2d");
var x = 125
var y = 125
var r = 100
var lat, lon, sunrise, sunset, noon, sunriseAbs, sunsetAbs, noonAbs
var lang = document.querySelector('html').lang
var msg = {
	'pt': {
		'pos': 'Calculado a partir da sua localização aproximada:',
		'r': 'reles',
		'p': 'primeiros',
		's': 'segundos',
		'sunrise': 'Nascer do sol',
		'sunset': 'Pôr do sol',
		'noon': 'Meio-dia solar'
	},
	'en': {
		'pos': 'Calculated from your approximate location:',
		'r': 'rels',
		'p': 'primers',
		's': 'seconds',
		'sunrise': 'Sunrise',
		'sunset': 'Sunset',
		'noon': 'Solar noon'
	}
}

var colors = {
	'sunrise': [255, 240, 115],
	'noon': [100, 180, 250],
	'sunset': [255, 140, 40],
	'midnight': [10, 15, 45]
}
var textColor = 'black'

function calcFactor(factor, min, max) {
	var diff = max - min
	factorRectified = factor - min
	factorRectified /= diff
	return factorRectified
}

function interpolateColor(color1, color2, factor) {
	console.log(color1, color2, factor)
	if (arguments.length < 3)
		factor = 0.5
	var result = color1.slice()
	for (var i = 0; i < 3; i++) {
		result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]))
	}
	return result
}

function changeLangEN() {
	document.querySelector('title').innerHTML = "What's the time in rels?"
	changeLang('en')
}

function changeLangPT() {
	document.querySelector('title').innerHTML = "Quantos reles são?"
	changeLang('pt')
}

function changeLang(langReq) {
	lang = langReq
	var elems = document.querySelectorAll('span>a')
	elems[0].classList.add('link')
	elems[1].classList.add('link')
	document.querySelector('a.' + lang).classList.remove('link')
	elems = document.querySelectorAll('div>.en,div>.pt')
	elems.forEach(elem => {
		elem.classList.add('hidden')
	});
	elems = document.querySelectorAll('div>.' + lang + '.hidden')
	elems.forEach(elem => {
		elem.classList.remove('hidden')
	});
	updateTable()
	document.querySelector('#local').innerHTML = msg[lang]['pos'] + '<br>' +
		lat + ', ' + lon
}

async function initLoc() {
	const res = await fetch('https://location.services.mozilla.com/v1/geolocate?key=test').then(el => el.json())
	return [res.location.lat, res.location.lng]
}

function toTimeAbs(time) {
	return time.getHours() / 24 + time.getMinutes() / (60 * 24) + time.getSeconds() / (60 * 60 * 24) + time.getMilliseconds() / (1000 * 60 * 60 * 24)
}

function toRelShort(timeAbs) {
	return ('00' + Math.floor(timeAbs * 100)).slice(-2) + 'r' + ('00' + Math.floor(timeAbs * 10000) % 100).slice(-2) + 'p'
}

function toTimeShort(time) {
	return ('00' + time.getHours()).slice(-2) + 'h' + ('00' + time.getMinutes()).slice(-2) + 'm'
}

function initClock() {
	ctx.clearRect(0, 0, c.width, c.height)
	ctx.strokeStyle = textColor;
	ctx.fillStyle = textColor;
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
	ctx.strokeStyle = textColor;
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
	ctx.strokeStyle = textColor;
	ctx.arc(x, y, 0.02 * r, 0, 2 * Math.PI);
	ctx.stroke();
}

function updateColor(color) {
	textColor = color
	initClock()
	document.querySelector('body').style.color = textColor
}

function updateTable() {
	var table = document.querySelector('#sun')
	table.rows[0].cells[0].innerHTML = msg[lang]['sunrise'] + ':'
	table.rows[0].cells[1].innerHTML = `00r00p (${toTimeShort(sunrise)})`
	table.rows[1].cells[0].innerHTML = msg[lang]['sunset'] + ':'
	table.rows[1].cells[1].innerHTML = `${toRelShort(sunsetAbs - sunriseAbs)} (${toTimeShort(sunset)})`
	table.rows[2].cells[0].innerHTML = msg[lang]['noon'] + ':'
	table.rows[2].cells[1].innerHTML = `${toRelShort(noonAbs - sunriseAbs)} (${toTimeShort(noon)})`
}

async function prepareSunReq() {
	var loc = await initLoc()
	lat = loc[0]
	lon = loc[1]
	document.querySelector('#local').innerHTML = msg[lang]['pos'] + '<br>' +
		lat + ', ' + lon
	makeSunReq()
}

function makeSunReq() {
	var requestSun = new XMLHttpRequest()
	requestSun.open('GET', 'https://api.sunrise-sunset.org/json?formatted=0&lat=' + lat + '&lng=' + lon, true)

	requestSun.onload = function () {
		var data = JSON.parse(this.response)
		console.log(data)

		sunrise = new Date(data['results']['sunrise'])
		sunset = new Date(data['results']['sunset'])
		noon = new Date(data['results']['solar_noon'])
		sunriseAbs = toTimeAbs(sunrise)
		sunsetAbs = toTimeAbs(sunset)
		noonAbs = toTimeAbs(noon)

		updateTable()

		var relsPrev = 0
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

			if (rels != relsPrev) {
				console.log(nowRel)
				if (nowRel < 0.1) {
					var color = interpolateColor(colors['sunrise'], colors['noon'], calcFactor(nowRel, 0.0, 0.1))
				} else if (nowRel < 0.4) {
					var color = colors['noon']
				} else if (nowRel < 0.5) {
					var color = interpolateColor(colors['noon'], colors['sunset'], calcFactor(nowRel, 0.4, 0.5))
				} else if (nowRel < 0.6) {
					var color = interpolateColor(colors['sunset'], colors['midnight'], calcFactor(nowRel, 0.5, 0.6))
				} else if (nowRel < 0.9) {
					updateColor('white')
					var color = colors['midnight']
				} else {
					updateColor('black')
					var color = interpolateColor(colors['midnight'], colors['sunrise'], calcFactor(nowRel, 0.9, 1.0))
				}
				console.log(color)
				document.querySelector('body').style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
				relsPrev = rels
			}

			animateHands(rels, relPrimers, relSeconds, relTertiaries)
			document.querySelector('#rels').innerHTML = `${("00" + rels).slice(-2)} ${msg[lang]['r']}, ${("00" + relPrimers).slice(-2)} ${msg[lang]['p']}, ${("00" + relSeconds).slice(-2)} ${msg[lang]['s']}`
			//console.log(nowRel)
		}, 10);
	}
	requestSun.send()
}

initClock()
prepareSunReq()