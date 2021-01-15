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
	// user-defined d3 format function
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
				context.lineTo(out.map.psBarWidth_, height);
				context.lineTo(out.map.psBarWidth_, 0);
				context.lineTo(0, 0);
				context.closePath();
			}
			shape = d3.symbol().type({ draw: drawRectangle })
		} else {
			let symbolType = getSymbolType(out.map.psShape_);
			shape = symbol().type(symbolType);
		}

		let domain = m.classifier_.domain();
		let maxVal = domain[1]; //maximum value of dataset (used for first symbol)

		//draw legend elements for classes: rectangle + label
		let totalHeight = 0; //sum of shape sizes
		for (let i = 1; i < out.cellNb + 1; i++) {

			//class number
			const ecl = out.ascending? out.cellNb-i+1 : i;

			let val = maxVal / ecl; // divide the maxVal by the 'cell number' index
			let size = m.classifier_(val); //size 


			//d3 symbol
			let d = shape.size(size * size)(); //set shape size and call

			//the vertical position of the legend element
			let x;
			let y;
			if (out.map.psShape_ == "bar") {
				// for vertical bars we dont use a dynamic X offset because all bars have the same width
				x = out.map.psBarWidth_ * 2;
				//we also dont need the y offset
				y = (out.boxPadding + (out.title ? out.titleFontSize + out.boxPadding : 0) + totalHeight);
			} else {
				x = out.boxPadding + (m.classifier_(maxVal)/1.5); //set X offset by the largest symbol size
				y = (out.boxPadding + (out.title ? out.titleFontSize + out.boxPadding : 0) + totalHeight) + size;
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

	return out;
}
