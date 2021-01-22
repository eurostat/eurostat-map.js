import { format } from "d3-format";
import { select } from "d3-selection";
import * as lg from '../core/legend';
import { symbolsLibrary } from "../maptypes/map-proportional-symbols";
import { symbol } from 'd3-shape';

/**
 * A legend for proportional symbol map
 * 
 * @param {*} map 
 */
export const legend = function (map, config) {

	//build generic legend object for the map
	const out = lg.legend(map);

	//the order of the legend elements. Set to false to invert.
	out.ascending = true;

	//size legend
	//number of elements in the legend
	out.cellNb = 4;
	//the distance between consecutive legend shape elements
	out.shapePadding = 10;
	//the distance between the legend box elements to the corresponding text label
	out.labelOffset = 25;

	//color legend
	//title of color legend
	out.colorTitle = null;
	//the size of the color legend shape elements
	out.colorShapeSize = 13;
	//the distance between the legend box elements to the corresponding text label
	out.colorLabelOffset = 20;
	//the distance between consecutive legend shape elements in the color legend
	out.colorShapePadding = 3;

	//shared
	//padding between title & legend body
	out.titlePadding = 10;
	//the font size of the legend label
	out.labelFontSize = 12;
	// user-defined d3 format function
	out.format = undefined;
	//the number of decimal for the legend labels
	out.labelDecNb = 2;


	//show no data
	out.noData = true;
	//no data text label
	out.noDataText = "No data";
	// //the separation line length
	 out.sepLineLength = 17;
	// //the separation line color
	 out.sepLineStroke = "black";
	// //the separation line width
	 out.sepLineStrokeWidth = 1;
	//spacing between color & size legends
	out.legendSpacing = 35;
	


	//override attribute values with config values
	if (config) for (let key in config) out[key] = config[key];

	//@override
	out.update = function () {
		const m = out.map;
		const lgg = out.lgg;

		//remove previous content
		lgg.selectAll("*").remove();

		//draw legend background box
		out.makeBackgroundBox();

		//draw title
		if (out.title)
			lgg.append("text").attr("x", out.boxPadding).attr("y", out.boxPadding + out.titleFontSize)
				.text(out.title)
				.style("font-size", out.titleFontSize).style("font-weight", out.titleFontWeight)
				.style("font-family", out.fontFamily).style("fill", out.fontFill)


		//set font family
		lgg.style("font-family", out.fontFamily);

		//define format for labels
		const f = out.format || format(",." + out.labelDecNb + "r");

		// legend for 
		if (m.classifierSize_) {
			buildSizeLegend(m, lgg, f)
		}
		// legend for ps color values
		if (m.classifierColor_) {
			buildColorLegend(m, lgg, f)
		}

		//set legend box dimensions
		out.setBoxDimension();
	}

	
	function buildSizeLegend(m, lgg, f) {
		let shape = getShape();
		let domain = m.classifierSize_.domain();
		let maxVal = domain[1]; //maximum value of dataset (used for first or last symbol)
		out._sizeLegendHeight = 0; //sum of shape sizes: used for positioning legend elements and color legend
		//draw legend elements for classes: symbol + label
		for (let i = 1; i < out.cellNb + 1; i++) {

			//calculate shape size using cellNb
			const ecl = out.ascending ? out.cellNb - i + 1 : i;
			let val = maxVal / ecl;
			let size = m.classifierSize_(val);

			//set shape size and define 'd'
			let d = shape.size(size * size)();

			//define position of the legend element
			let x;
			let y;
			if (out.map.psShape_ == "bar") {
				// for vertical bars we dont use a dynamic X offset because all bars have the same width
				x = out.map.psBarWidth_ * 2;
				//we also dont need the y offset
				y = (out.boxPadding + (out.title ? out.titleFontSize + out.boxPadding + out.titlePadding : 0) + out._sizeLegendHeight); 
			} else {
				// x and y for all other symbols
				out._xOffset = (m.classifierSize_(maxVal) / 1.5); //save value (to use in color legend as well)
				x = out.boxPadding + out._xOffset; //set X offset by the largest symbol size
				y = (out.boxPadding + (out.title ? out.titleFontSize + out.boxPadding : 0) + out._sizeLegendHeight) + size/2 + out.shapePadding;
			}
			out._sizeLegendHeight = out._sizeLegendHeight + size + out.shapePadding;

			//append symbol & style
			lgg.append("g")
				.attr("transform", `translate(${x},${y})`)
				.style("fill", d => {
					// if secondary stat variable is used for symbol colouring, then dont colour the legend symbols using psFill()
					if (!m.classifierColor_) {
						return m.psFill()
					} else {
						return "none"
					}
				})
				.style("fill-opacity", m.psFillOpacity())
				.style("stroke", m.psStroke())
				.style("stroke-width", m.psStrokeWidth())
				.attr("stroke", "black").attr("stroke-width", 0.5)
				.append("path")
				.attr('d', d)

			//label position
			let labelX = x + out.labelOffset;
			let labelY = y;
			if (out.map.psShape_ == "bar") {
				labelY = labelY + (size / 2)
			}

			//append label
			lgg.append("text").attr("x", labelX).attr("y", labelY)
				.attr("alignment-baseline", "middle")
				.text(f(val))
				.style("font-size", out.labelFontSize).style("font-family", out.fontFamily).style("fill", out.fontFill)
		}
	}

	function buildColorLegend(m, lgg, f) {
		const svgMap = m.svg();

		//title
		if (out.colorTitle)
		lgg.append("text").attr("x", out.boxPadding).attr("y", out._sizeLegendHeight+ out.boxPadding + out.titleFontSize + out.legendSpacing + out.titlePadding)
			.text(out.colorTitle)
			.style("font-size", out.titleFontSize).style("font-weight", out.titleFontWeight)
			.style("font-family", out.fontFamily).style("fill", out.fontFill)

		// x position of color legend cells
		let x = out.colorShapeSize + out.boxPadding;

		//draw legend elements for classes: rectangle + label
		let clnb = m.psClasses_;
		
		for (let i = 0; i < clnb; i++) {

			//the vertical position of the legend element
			const y = (out._sizeLegendHeight + out.boxPadding + (out.colorTitle ? out.titleFontSize + out.boxPadding + (out.titlePadding*2) : 0) + i * (out.colorShapeSize + out.colorShapePadding)) + out.legendSpacing + out.colorShapePadding;

			//the class number, depending on order
			const ecl = out.ascending ? clnb - i + 1 : i;

			//shape
			let shape = getShape();
			let d = shape.size(out.colorShapeSize * out.colorShapeSize)();

			//append symbol & style
			lgg.append("g")
				.attr("transform", `translate(${x},${y})`)
				.attr("fill", m.classToFillStyle()(ecl, clnb))
				.style("fill-opacity", m.psFillOpacity())
				.style("stroke", m.psStroke())
				.style("stroke-width", m.psStrokeWidth())
				.attr("stroke", "black").attr("stroke-width", 0.5)
				.append("path")
				.attr('d', d)
				.on("mouseover", function () {
					//for ps, the symbols are the children of each g_ps element
					const parents = svgMap.select("#g_ps").selectAll("[ecl='" + ecl + "']");
					let cellFill = select(this.parentNode).attr("fill")
					// save legend cell fill color to revert during mouseout:
					select(this).attr("fill___", cellFill);
					parents.each(function (d, i) {
						let ps = select(this.childNodes[0]);
						ps.style("fill", m.nutsrgSelFillSty());

					});
					select(this).style("fill", m.nutsrgSelFillSty());
				})
				.on("mouseout", function () {
					//for ps, the symbols are the children of each g_ps element
					const parents = svgMap.select("#g_ps").selectAll("[ecl='" + ecl + "']");
					let cellFill = select(this).attr("fill___");
					parents.each(function (d, i) {
						let ps = select(this.childNodes[0]);
						ps.style("fill", cellFill);
					});
					select(this).style("fill", m.classToFillStyle()(ecl, clnb));
				});

			//separation line
			if (i > 0)
				lgg.append("line").attr("x1", x).attr("y1", y - out.colorShapeSize + (out.colorShapePadding/2)).attr("x2", x + out.sepLineLength).attr("y2", y - out.colorShapeSize + (out.colorShapePadding/2))
					.attr("stroke", out.sepLineStroke).attr("stroke-width", out.sepLineStrokeWidth);

			//label
			if (i < clnb -1 )
				lgg.append("text").attr("x", x + out.colorLabelOffset).attr("y", y + out.colorShapeSize/2)
					.attr("alignment-baseline", "middle")
					.text(f(m.classifierColor_.invertExtent(ecl)[out.ascending ? 0 : 1]))
					.style("font-size", out.labelFontSize).style("font-family", out.fontFamily).style("fill", out.fontFill)
		}

		//'no data' legend box
		if (out.noData) {
			const y = (out._sizeLegendHeight + out.boxPadding + (out.colorTitle ? out.titleFontSize + out.boxPadding + (out.titlePadding*2) : 0) + m.psClasses_ * (out.colorShapeSize + out.colorShapePadding)) + out.legendSpacing + out.colorShapePadding;

			//shape
			let shape = getShape();
			let d = shape.size(out.colorShapeSize * out.colorShapeSize)();
			//append symbol & style
			lgg.append("g")
				.attr("transform", `translate(${x},${y})`)
				.attr("fill", m.noDataFillStyle())
				.style("fill-opacity", m.psFillOpacity())
				.style("stroke", m.psStroke())
				.style("stroke-width", m.psStrokeWidth())
				.attr("stroke", "black").attr("stroke-width", 0.5)
				.append("path")
				.attr('d', d)
				.on("mouseover", function () {
					const parents = svgMap.select("#g_ps").selectAll("[ecl='nd']");
					let cellFill = select(this.parentNode).attr("fill")
					// save legend cell fill color to revert during mouseout:
					select(this).attr("fill___", cellFill);
					//for ps, the symbols are the children of each g_ps element
					parents.each(function (d, i) {
						let ps = select(this.childNodes[0]);
						ps.style("fill", m.noDataFillStyle());

					});
					select(this).style("fill", m.nutsrgSelFillSty());
				})
				.on("mouseout", function () {
					//for ps, the symbols are the children of each g_ps element
					const parents = svgMap.select("#g_ps").selectAll("[ecl='nd']");
					let cellFill = select(this).attr("fill___");
					parents.each(function (d, i) {
						let ps = select(this.childNodes[0]);
						ps.style("fill", cellFill);
					});
					select(this).style("fill", m.noDataFillStyle());
				});

			//'no data' label
			lgg.append("text").attr("x", x + out.colorLabelOffset).attr("y", y)
				.attr("alignment-baseline", "middle")
				.text(out.noDataText)
				.style("font-size", out.labelFontSize).style("font-family", out.fontFamily).style("fill", out.fontFill)
		}
	}


	// returns the d3.symbol object chosen by the user
	function getShape() {
		let shape;
		if (out.map.psShape_ == "custom") {
			shape = out.map.psCustomShape_;
		} else if (out.map.psShape_ == "bar") {
			//for rectangles, we use a custom d3 symbol
			let drawRectangle = (context, size) => {
				let height = Math.sqrt(size);
				context.moveTo(0, 0)
				context.lineTo(0, height);
				context.lineTo(out.map.psBarWidth_, height);
				context.lineTo(out.map.psBarWidth_, 0);
				context.lineTo(0, 0);
				context.closePath();
			}
			shape = d3.symbol().type({ draw: drawRectangle })
		} else {
			let symbolType = symbolsLibrary[out.map.psShape_] || symbolsLibrary["circle"];
			shape = symbol().type(symbolType);
		}
		return shape;
	}

	return out;
}
