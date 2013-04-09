function $(expr, con) { return (con || document).querySelector(expr); }
function $$(expr, con) { return [].slice.call((con || document).querySelectorAll(expr)); }

// Make each ID a global variable
// Many browsers do this anyway (it’s in the HTML5 spec), so it ensures consistency
$$('[id]').forEach(function(element) {
	window[element.id.replace(/-(.)/g, function ($0, $1) { return $1.toUpperCase() })] = element;
});

var svg = $('svg'),
    path = $('path');

function update() {
	// Apply values to fallback
	fallback.style.borderRadius = borderRadius.value;
	fallback.style.width = width.value;
	fallback.style.height = height.value;
	
	// Make SVG
	var cs = getComputedStyle(fallback);
	
	var r = [];
	
	var w = fallback.offsetWidth,
	    h = fallback.offsetHeight;
	    
	svg.setAttribute('width', w);
	svg.setAttribute('height', h);
	
	// Build 2D array with corner radii, resolve % to px
	['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].forEach(function(corner, i) {
		var values = cs['border' + corner + 'Radius'].split(/\s+/);
		console.log(values);
		if (values.length == 1) {
			values[1] = values[0];
		}
		
		values[0] = parseFloat(values[0]) * (values[0].indexOf('%') > -1? w / 100 : 1);
		values[1] = parseFloat(values[1]) * (values[1].indexOf('%') > -1? h / 100 : 1);

		if (values[0] === 0) {
			values[1] = 0;
		}
		
		if (values[1] === 0) {
			values[0] = 0;
		}
		
		r[i] = values;
	});
	
	// Shrink overlapping curves
	var ratio = [1,1];
	
	for (var i=0; i<r.length; i++) {
		var radii = r[i],
			radiiAdj = r[i + (i % 2? -1 : 1)];
			
		ratio[0] = Math.min(
			ratio[0],
			w / (radii[0] + radiiAdj[0])
		);
	}
	
	for (var i=0; i<r.length; i++) {
		var radii = r[i],
			radiiAdj = r[(i % 2? i+5 : i+3) % 4];

		ratio[1] = Math.min(
			ratio[1],
			h / (radii[1] + radiiAdj[1])
		);
	}
	
	if (ratio[0] < 1 || ratio[1] < 1) {
		for (var i=0; i<r.length; i++) {
			r[i][0] *= ratio[0];
			r[i][1] *= ratio[1];
		}
	}
	
	var shape = borderCornerShape.value;
	
	var d = ['M', r[0][0], '0'];
	
	d.push('h', w - r[0][0] - r[1][0]);
	drawCorner(0, shape, w, h, r[1], d);
	d.push('v', h - r[1][1] - r[2][1]);
	drawCorner(1, shape, w, h, r[2], d);
	d.push('h', -w + r[2][0] + r[3][0]);
	drawCorner(2, shape, w, h, r[3], d);
	d.push('v', -h + r[3][1] + r[0][1]);
	drawCorner(3, shape, w, h, r[0], d);
	
	d.push('Z');
	
	path.setAttribute('d', d.join(' '));
}

function drawCorner(corner, shape, w, h, r, d) {
	if (shape == 'notch') {
		switch (corner) {
			case 0:
				d.push('v', r[1], 'h', r[0]);
				break;
			case 1:
				d.push('h', -r[0], 'v', r[1]);
				break;
			case 2:
				d.push('v', -r[1], 'h', -r[0]);
				break;
			case 3:
				d.push('h', r[0], 'v', -r[1]);
		}
	}
	else {
		if (shape == 'curve' || shape == 'scoop') {
			var sweep = +(shape == 'curve');
			
			d.push('a', r[0], r[1], '0', 0, sweep);
		}
		else if (shape == 'bevel') {
			d.push('l');
		}
		
		d.push(corner == 1 || corner == 2? -r[0] : r[0]);
		
		d.push(corner == 2 || corner == 3? -r[1] : r[1]);
	}
}

borderCornerShape.onchange = update;

(function(){
	var test = document.createElement('div')
	test.style.width = '1ch';
	var supportsCh = !!test.style.width;
	
	if (!supportsCh) {
		test.style.position = 'absolute';
		test.textContent = '0';
		
		code.appendChild(test);
		
		var chEmRatio = test.offsetWidth / parseFloat(getComputedStyle(test).fontSize);
		
		code.removeChild(test);	
	}
	
	window.pxToCh = function (px) {
		return supportsCh? px + 'ch' : px * chEmRatio + 'em';
	};
})();

$$('input').forEach(function(input) {
	new Incrementable(input);
	
	(input.oninput = function() {
		input.style.width = pxToCh(input.value.length);
		update();
	})();
});