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
	
	// Make SVG
	var cs = getComputedStyle(fallback);
	
	var r = [];
	
	// Build 2D array with corner radii
	['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].forEach(function(corner, i) {
		var values = cs['border' + corner + 'Radius'].split(/\s+/);

		if (values.length == 1) {
			values[1] = values[0];
		}
		
		r[i] = [values[0], values[1]];
	});
	
	var w = +svg.getAttribute('width'),
	    h = +svg.getAttribute('height')
	
	// Resolve everything to px
	for (var i=0; i<r.length; i++) {
	
		for (var j=0; j<r[i].length; j++) {
			var percentage = r[i][j].indexOf('%') > -1;
			var value = parseFloat(r[i][j]);
			
			if (percentage) {
				value = (j? h : w) * value / 100;
			}
			
			r[i][j] = value;
		}
	}
	
	// Shrink overlapping curves
	/*
		r[0][0] + r[1][0] < w
		r[2][0] + r[3][0] < w
		
		r[1][1] + r[2][1] < h
		r[3][1] + r[0][1] < h
	*/
	var ratio = w / r[0][0] + r[1][0];
	if (ratio < 1) {
		r[0][0] *= ratio;
		r[1][0] *= ratio;
	}
	
	ratio = w / r[2][0] + r[3][0];
	if (ratio < 1) {
		r[2][0] *= ratio;
		r[3][0] *= ratio;
	}
	
	ratio = h / r[1][1] + r[2][1];
	if (ratio < 1) {
		r[1][1] *= ratio;
		r[2][1] *= ratio;
	}
	
	ratio = h / r[3][1] + r[0][1];
	if (ratio < 1) {
		r[3][1] *= ratio;
		r[0][1] *= ratio;
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

borderRadius.oninput = borderCornerShape.onchange = update;

update();