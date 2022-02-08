import { format } from "d3-format";
import { select } from "d3-selection";
import * as lg from '../core/legend';
import { symbolsLibrary } from "../maptypes/map-proportional-symbols";
import { symbol } from 'd3-shape';
import { spaceAsThousandSeparator } from "../lib/eurostat-map-util";
import { formatDefaultLocale } from "d3-format";

//set legend labels locale
formatDefaultLocale({
	"decimal": ".",
	"thousands": " ",
	"grouping": [3],
	"currency": ["", "€"]
})

/**
 * A legend for proportional symbol map
 * 
 * @param {*} map 
 */
export const legend = function (map, config) {

	//build generic legend object for the map
	const out = lg.legend(map);

	out.ascending = false; //the order of the legend elements. Set to false to invert.
	out.legendSpacing = 35; //spacing between color & size legends (if applicable)
	out.labelFontSize = 12; //the font size of the legend labels

	//size legend config (legend illustrating the values of different symbol sizes)
	out.sizeLegend = {
		title: null,
		titlePadding: 10,//padding between title and legend body
		cellNb: 4, //number of elements in the legend
		shapePadding: 10, //the y distance between consecutive legend shape elements
		shapeOffset: { x: 0, y: 0 },
		shapeFill: "white",
		labelOffset: { x: 25, y:0}, //the distance between the legend box elements to the corresponding text label
		labelDecNb: 0, //the number of decimal for the legend labels
		labelFormat: undefined
	}

	// color legend config (legend illustrating the data-driven colour classes)
	out.colorLegend = {
		title: null,
		titlePadding: 10, //padding between title and legend body
		shapeWidth: 13, //the width of the legend box elements
		shapeHeight: 15, //the height of the legend box elements
		shapePadding: 1, //the distance between consecutive legend shape elements in the color legend
		labelOffset: { x: 25, y:0}, //distance (x) between label text and its corresponding shape element
		labelDecNb: 0, //the number of decimal for the legend labels
		labelFormat: undefined, // user-defined d3 format function	
		noData: true, //show no data
		noDataText: "No data", //no data text label
		sepLineLength: 17,// //the separation line length
		sepLineStroke: "black", //the separation line color
		sepLineStrokeWidth: 1, //the separation line width
	}

	//override attribute values with config values
	if (config) for (let key in config) {
		if (key == "colorLegend" || key == "sizeLegend") {
			for (let p in out[key]) {
				//override each property in size and color legend configs
				if (config[key][p]) {
					out[key][p] = config[key][p]
				}
			}
		} else {
			out[key] = config[key];
		}
	}


	//@override
	out.update = function () {
		const m = out.map;
		const lgg = out.lgg;

		// update legend parameters if necessary
		if (m.legend_) for (let key in m.legend_) {
			if (key == "colorLegend" || key == "sizeLegend") {
				for (let p in out[key]) {
					//override each property in size and color legend m.legend_
					if (m.legend_[key][p]) {
						out[key][p] = m.legend_[key][p]
					}
				}
			} else {
				out[key] = m.legend_[key];
			}
		}

		//remove previous content
		lgg.selectAll("*").remove();

		//draw legend background box
		out.makeBackgroundBox();

		//set font family
		lgg.style("font-family", m.fontFamily_);

		// legend for 
		if (m.classifierSize_) {
			buildSizeLegend(m, lgg, out.sizeLegend)
		}
		// legend for ps color values
		if (m.classifierColor_) {
			buildColorLegend(m, lgg, out.colorLegend)
		}

		//set legend box dimensions
		out.setBoxDimension();
	}

	/**
	 * Builds a legend which illustrates the statistical values of different symbol sizes
	 * 
	 * @param {*} m map 
	 * @param {*} lgg parent legend object from core/legend.js 
	 * @param {*} config size legend config object (sizeLegend object specified as property of legend() config object)
	 */
	function buildSizeLegend(m, lgg, config) {
		//define format for labels
		let f = config.labelFormat || spaceAsThousandSeparator;
		//draw title
		if (config.title) {
			lgg.append("text").attr("x", out.boxPadding).attr("y", out.boxPadding + out.titleFontSize)
				.text(config.title)
				.style("font-size", out.titleFontSize + "px").style("font-weight", out.titleFontWeight)
				.style("font-family", m.fontFamily_).style("fill", out.fontFill)
		}

		let shape = getShape();
		let domain = m.classifierSize_.domain();
		let maxVal = domain[1]; //maximum value of dataset (used for first or last symbol)
		out._sizeLegendHeight = 0; //sum of shape sizes: used for positioning legend elements and color legend

		//draw legend elements for classes: symbol + label
		for (let i = 1; i < config.cellNb + 1; i++) {
			//calculate shape size using cellNb
			const ecl = out.ascending ? config.cellNb - i + 1 : i;
			let val = maxVal / ecl;
			let size = m.classifierSize_(val);

			//set shape size and define 'd'
			let d = out.map.psCustomPath_ ? out.map.psCustomPath_ : shape.size(size * size)();

			//define position of the legend element
			let x;
			let y;
			if (out.map.psShape_ == "bar") {
				// for vertical bars we dont use a dynamic X offset because all bars have the same width
				x = out.boxPadding + 10;
				//we also dont need the y offset
				y = (out.boxPadding + (config.title ? out.titleFontSize + out.boxPadding + config.titlePadding : 0) + out._sizeLegendHeight);
			} else {
				// x and y for all other symbols
				out._xOffset = (m.classifierSize_(maxVal) / 1.5); //save value (to use in color legend as well)
				x = out.boxPadding + out._xOffset; //set X offset
				y = (out.boxPadding + (config.title ? out.titleFontSize + out.boxPadding + config.titlePadding : 0) + out._sizeLegendHeight) + size / 2 + config.shapePadding;
			}
			out._sizeLegendHeight = out._sizeLegendHeight + size + config.shapePadding;

			//append symbol & style
			let symb = lgg.append("g")
				.attr("transform", `translate(${x},${y})`)
				.style("fill", d => {
					// if secondary stat variable is used for symbol colouring, then dont colour the legend symbols using psFill()
					return m.classifierColor_ ? config.shapeFill : m.psFill_
				})
				.style("fill-opacity", m.psFillOpacity())
				.style("stroke", m.psStroke())
				.style("stroke-width", m.psStrokeWidth())
				.attr("stroke", "black").attr("stroke-width", 0.5)
				.append("path")
				.attr('d', d)
				.attr('transform', `translate(${config.shapeOffset.x},${config.shapeOffset.y})`)

			//scale the custom path using the transform attribute
			if (out.map.psCustomPath_) {
				symb.attr('transform', `translate(${config.shapeOffset.x},${config.shapeOffset.y}) scale(${size})`)
			}

			//label position
			let labelX = x + config.labelOffset.x;
			let labelY = y + config.labelOffset.y;
			if (out.map.psShape_ == "bar") {
				labelY = labelY + (size / 2)
			}

			//append label
			lgg.append("text").attr("x", labelX).attr("y", labelY)
				.attr("alignment-baseline", "middle")
				.text(f(val))
				.style("font-size", out.labelFontSize + "px").style("font-family", m.fontFamily_).style("fill", out.fontFill)
		}
	}


	/**
 * Builds a legend illustrating the statistical values of different symbol colours
 * 
 * @param {*} m map 
 * @param {*} lgg parent legend object from core/legend.js 
 * @param {*} config color legend config object (colorLegend object specified as property of legend config parameter)
 */
	function buildColorLegend(m, lgg, config) {
		//define format for labels
		let f = config.labelFormat || spaceAsThousandSeparator;
		const svgMap = m.svg();

		//title
		if (config.title)
			lgg.append("text").attr("x", out.boxPadding).attr("y", out._sizeLegendHeight + out.boxPadding + out.titleFontSize + out.legendSpacing + config.titlePadding)
				.text(config.title)
				.style("font-size", out.titleFontSize + "px").style("font-weight", out.titleFontWeight)
				.style("font-family", m.fontFamily_).style("fill", out.fontFill)

		// x position of color legend cells
		let x = out.boxPadding;

		//draw legend elements for classes: rectangle + label
		let clnb = m.psClasses_;

		for (let i = 0; i < clnb; i++) {

			//the vertical position of the legend element
			let y = (out._sizeLegendHeight + out.boxPadding + (config.title ? out.titleFontSize + (config.titlePadding * 2) : 0) + i * (config.shapeHeight + config.shapePadding)) + out.legendSpacing + config.shapePadding;

			//the class number, depending on order
			const ecl = out.ascending ? i : clnb - i - 1;

			// we now use rect instead of shapes
			// let shape = getShape();
			// let d = out.map.psCustomPath_ ? out.map.psCustomPath_ : shape.size(config.shapeSize * config.shapeSize)();

			//append symbol & style
			lgg.append("g")
				.attr("transform", `translate(${x},${y})`)
				.attr("fill", m.psClassToFillStyle()(ecl, clnb))
				.style("fill-opacity", m.psFillOpacity())
				.style("stroke", m.psStroke())
				.style("stroke-width", 1)
				.attr("stroke", "black").attr("stroke-width", 0.5)
				// .append("path")
				// .attr('d', d)
				.append("rect")
				.attr("width", config.shapeWidth).attr("height", config.shapeHeight)
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
					select(this).style("fill", m.psClassToFillStyle()(ecl, clnb));
				});

			//separation line
			let lineY = out.map.psShape_ == "bar" ? y : y;
			if (i > 0) {
				lgg.append("line").attr("x1", x).attr("y1", lineY).attr("x2", x + config.sepLineLength).attr("y2", lineY)
					.attr("stroke", config.sepLineStroke).attr("stroke-width", config.sepLineStrokeWidth);
			}

			//label
			let labelY = y + config.labelOffset.y + (out.labelFontSize * 1.2);
			if (i < clnb - 1) {
				lgg.append("text").attr("x", x + config.labelOffset.x).attr("y", labelY)
					.attr("alignment-baseline", "middle")
					.text(d => {
						let text = f(m.classifierColor_.invertExtent(out.ascending ? ecl + 1 : ecl - 1)[out.ascending ? 0 : 1])
						return text;
					})
					.style("font-size", out.labelFontSize + "px").style("font-family", m.fontFamily_).style("fill", out.fontFill)
			}
		}

		//'no data' legend box
		if (config.noData) {
			const y = (out._sizeLegendHeight + out.boxPadding + (config.title ? out.titleFontSize + out.boxPadding + (config.titlePadding * 2) : 0) + m.psClasses_ * (config.shapeHeight + config.shapePadding)) + out.legendSpacing + config.shapePadding;

			//shape
			// let shape = getShape();
			// let d = out.map.psCustomPath_ ? out.map.psCustomPath_ : shape.size(config.shapeSize * config.shapeSize)();
			//append symbol & style
			lgg.append("g")
				.attr("transform", `translate(${x},${y})`)
				.attr("fill", m.noDataFillStyle())
				.style("fill-opacity", m.psFillOpacity())
				.style("stroke", m.psStroke())
				.attr("stroke-width", 1)
				// .append("path")
				// .attr('d', d)
				.append("rect")
				.attr("width", config.shapeWidth).attr("height", config.shapeHeight)
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
			lgg.append("text").attr("x", x + config.labelOffset.x).attr("y", y + out.boxPadding)
				.attr("alignment-baseline", "middle")
				.text(config.noDataText)
				.style("font-size", out.labelFontSize + "px").style("font-family", m.fontFamily_).style("fill", out.fontFill)
		}
	}


	// returns the d3.symbol object chosen by the user
	function getShape() {
		let shape;
		if (out.map.psCustomPath_) {
			shape = out.map.psCustomPath_;
		} else if (out.map.psCustomShape_) {
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
