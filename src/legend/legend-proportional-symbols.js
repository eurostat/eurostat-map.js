import { legendSize, legendSymbol } from "d3-svg-legend";
import { select } from "d3-selection";
import { format } from "d3-format";
import { scaleOrdinal } from "d3-scale";
import * as lg from '../core/legend';
import { getSymbolType } from "../maptypes/map-proportional-symbols";
import { symbol } from 'd3-shape';

/**
 * A legend for proportional symbol map
 * 
 * @param {*} map 
 */
export const legendProportionalSymbols = function (map, config) {

	//build generic legend object for the map
	const out = lg.legend(map, config);

	//number of elements in the legend
	out.cellNb = 4;
	//the order of the legend elements. Set to false to invert.
	out.ascending = true;
	//the distance between consecutive legend box elements
	out.shapePadding = 5;
	//the font size of the legend label
	out.labelFontSize = 12;
	// user-define d3 format function
	out.format = undefined;
	//the number of decimal for the legend labels
	out.labelDecNb = 2;
	//the distance between the legend box elements to the corresponding text label
	out.labelOffset = 25;

	//override attribute values with config values
	if (config) for (let key in config) out[key] = config[key];

	//@override
	out.update = function () {
		const m = out.map;
		const svgMap = m.svg();
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

		//custom and d3.symbol shapes
		// use legendSize() with custom scale for d3 shapes

		let shape; //d3.symbol

		if (out.map.psShape_ == "custom") {
			shape = out.map.psCustomShape_;
		} else if (out.map.psShape_ == "bar") {
			//for rectangles, we use a custom d3 symbol
			let drawRectangle = (context, size) => {
				let height = Math.sqrt(size);
				context.moveTo(0, 0)
				context.lineTo(0, height);
				context.lineTo(out.map.psWidth_, height);
				context.lineTo(out.map.psWidth_, 0);
				context.lineTo(0, 0);
				context.closePath();
			}

			shape = d3.symbol().type({ draw: drawRectangle })
		} else {
			let symbolType = getSymbolType(out.map.psShape_);
			shape = symbol().type(symbolType);
		}

		let domain = m.classifier_.domain();
		let maxVal = domain[1]; //maximum value of dataset
		let sizes = []; //stores values of the legend entries
		let shapes = []; //d3.symbol

		//draw legend elements for classes: rectangle + label
		let totalHeight = 0; //sum of shape sizes
		for (let i = 1; i < out.cellNb + 1; i++) {

			let val = maxVal / i; //value
			let size = m.classifier_(val); //size 
			sizes.push(size)

			//the vertical position of the legend element


			//symbol
			let d = shape.size(size * size)(); //set shape size and call
			let x;
			let y;
			if (out.map.psShape_ == "bar") {
				// for vertical bars we dont use a dynamic X offset because all bars have the same width
				x = out.map.psWidth_ * 2;
				//we also dont need the y offset
				y = (out.boxPadding + (out.title ? out.titleFontSize + out.boxPadding : 0) + totalHeight);
			} else {
				x = out.boxPadding + m.classifier_(maxVal); //set X offset as largest symbol size
				y = (out.boxPadding + (out.title ? out.titleFontSize + out.boxPadding : 0) + totalHeight) + size * i;
			}
			totalHeight = totalHeight + size + out.shapePadding;

			lgg.append("g")
				.attr("transform", `translate(${x},${y})`)
				.style("fill", m.psFill())
				.style("fill-opacity", m.psFillOpacity())
				.style("stroke", m.psStroke())
				.style("stroke-width", m.psStrokeWidth())
				.attr("stroke", "black").attr("stroke-width", 0.5)
				.append("path")
				.attr('d', d)

			//label
			let labelX = x + out.labelOffset;
			let labelY = y;
			if (out.map.psShape_ == "bar") {
				labelY = labelY + (size / 2)
			}
			lgg.append("text").attr("x", labelX).attr("y", labelY)
				.attr("alignment-baseline", "middle")
				.text(f(val))
				.style("font-size", out.labelFontSize).style("font-family", out.fontFamily).style("fill", out.fontFill)
		}

		//set legend box dimensions
		out.setBoxDimension();
	}

	//@override
	// out.update = function () {
	// 	const m = out.map;
	// 	//const svgMap = m.svg();
	// 	const lgg = out.lgg;

	// 	//remove previous content
	// 	lgg.selectAll("*").remove();

	// 	//? necessary. But should become obsolete when abandonning "d3-svg-legend"
	// 	lgg.attr("transform", "translate(20,10)")

	// 	//draw legend background box
	// 	out.makeBackgroundBox();

	// 	//define legend
	// 	//see http://d3-legend.susielu.com/#size

	// 	let d3Legend
	// 	let orient = "vertical";

	// 	if (out.map.psShape_ == "circle") {
	// 		// for standard circle legend
	// 		d3Legend = legendSize()
	// 			.shape("circle")
	// 			.scale(m.classifier());
	// 	} else {
	// 		//custom and d3.symbol shapes
	// 		// use legendSize() with custom scale for d3 shapes
	// 		let domain = m.classifier_.domain();
	// 		let shape;
	// 		let cells = out.cellNb + 1;

	// 		if (out.map.psShape_ == "custom") {
	// 			shape = out.map.psCustomShape_;
	// 		} else if (out.map.psShape_ == "bar") {
	// 			//for rectangles, we use a custom d3 symbol
	// 			let drawRectangle = (context, size) => {
	// 				let height = Math.sqrt(size);
	// 				context.moveTo(0, 0)
	// 				context.lineTo(0, height);
	// 				context.lineTo(out.map.psWidth_, height);
	// 				context.lineTo(out.map.psWidth_, 0);
	// 				context.lineTo(0, 0);
	// 				context.closePath();
	// 			}

	// 			shape = d3.symbol().type({ draw: drawRectangle })
	// 		} else {
	// 			let symbolType = getSymbolType(out.map.psShape_);
	// 			shape = symbol().type(symbolType);
	// 		}

	// 		let values = [];
	// 		let shapes = [];
	// 		let classNumber = out.cellNb;
	// 		let maxVal = domain[1];
	// 		for (let i = classNumber; i > 0; i--) {
	// 			let val = maxVal / i;
	// 			values.push(val);
	// 			let size = m.classifier_(val);
	// 			shapes.push(shape.size(size * size)());
	// 		}

	// 		var symbolScale = scaleOrdinal()
	// 			.domain(values)
	// 			.range(//d3 symbols
	// 				shapes);


	// 		d3Legend = legendSymbol()
	// 			.scale(symbolScale);

	// 	}

	// 	//common methods between all ps legends:
	// 	d3Legend
	// 		.title(out.titleText)
	// 		.titleWidth(out.titleWidth)
	// 		//.scale(m.classifier())
	// 		.cells(out.cellNb + 1)
	// 		.cellFilter(function (d) { if (!d.data) return false; return true; })
	// 		.orient(orient)
	// 		.labelWrap(10)
	// 		.ascending(out.ascending)
	// 		//.shape("circle") //"rect", "circle", or "line"
	// 		.shapePadding(out.shapePadding)
	// 		//.classPrefix("prefix")
	// 		.labels(function (d) {
	// 			//for some reason formatting is not applied to legendSymbol legends
	// 			let f = out.format || format(",." + out.labelDecNb + "r");
	// 			if (out.map.psShape_ == "bar" || out.map.psShape_ == "custom") {
	// 				return f(d.generatedLabels[d.i])
	// 			} else {
	// 				return d.generatedLabels[d.i]
	// 			}

	// 		})
	// 		//.labelAlign("middle") //?
	// 		.labelFormat(out.format || format(",." + out.labelDecNb + "r"))
	// 		.labelOffset(out.labelOffset)
	// 		.labelWrap(out.labelWrap)

	// 	//make legend
	// 	lgg.call(d3Legend);

	// 	//apply style to legend elements
	// 	lgg.selectAll(".swatch")
	// 		.style("fill", m.psFill())
	// 		.style("fill-opacity", m.psFillOpacity())
	// 		.style("stroke", m.psStroke())
	// 		.style("stroke-width", m.psStrokeWidth());

	// 	lgg.select(".legendTitle").style("font-size", out.titleFontSize);
	// 	lgg.selectAll("text.label").style("font-size", out.labelFontSize);
	// 	lgg.style("font-family", out.fontFamily);

	// 	//set legend box dimensions
	// 	out.setBoxDimension();
	// }

	return out;
}
