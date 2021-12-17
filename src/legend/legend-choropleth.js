import { select } from "d3-selection";
import { format } from "d3-format";
import * as lg from '../core/legend';
import { spaceAsThousandSeparator } from "../lib/eurostat-map-util";

/**
 * A legend for choropleth maps
 * 
 * @param {*} map 
 */
export const legend = function (map, config) {

	//build generic legend object for the map
	const out = lg.legend(map);

	//the order of the legend elements. Set to false to invert.
	out.ascending = true;

	//the width of the legend box elements
	out.shapeWidth = 13;
	//the height of the legend box elements
	out.shapeHeight = 15;

	//the separation line length
	out.sepLineLength = 17;
	//the separation line color
	out.sepLineStroke = "black";
	//the separation line width
	out.sepLineStrokeWidth = 1;

	//the font size of the legend label
	out.labelFontSize = 12;
	//the number of decimal for the legend labels
	out.labelDecNb = 2;
	//the distance between the legend box elements to the corresponding text label
	out.labelOffset = 3;

	//show no data
	out.noData = true;
	//no data text label
	out.noDataText = "No data";

	//override attribute values with config values
	if(config) for (let key in config) out[key] = config[key];


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
		if(out.title)
			lgg.append("text").attr("x", out.boxPadding).attr("y", out.boxPadding + out.titleFontSize)
			.text(out.title)
			.style("font-size", out.titleFontSize + "px").style("font-weight", out.titleFontWeight)
			.style("font-family", m.fontFamily_).style("fill", out.fontFill)

		//set font family
		lgg.style("font-family", m.fontFamily_);

		//define format for labels
		const f = format("." + out.labelDecNb + "f");

		//draw legend elements for classes: rectangle + label
		for(let i=0; i<m.clnb(); i++) {

			//the vertical position of the legend element
			const y = out.boxPadding + (out.title? out.titleFontSize + out.boxPadding : 0) + i*out.shapeHeight;

			//the class number, depending on order
			const ecl = out.ascending? m.clnb()-i-1 : i;

			//rectangle
			lgg.append("rect").attr("x", out.boxPadding).attr("y", y)
			.attr("width", out.shapeWidth).attr("height", out.shapeHeight)
			.attr("fill", m.classToFillStyle()(ecl, m.clnb()))
			.on("mouseover", function () {
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				sel.style("fill", m.nutsrgSelFillSty());
				sel.attr("fill___", function () { select(this).attr("fill"); });
				select(this).style("fill", m.nutsrgSelFillSty());
			})
			.on("mouseout", function () {
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				sel.style("fill", function () { select(this).attr("fill___"); });
				select(this).style("fill", m.classToFillStyle()(ecl, m.clnb()));
			});

			//separation line
			if(i>0)
				lgg.append("line").attr("x1", out.boxPadding).attr("y1", y).attr("x2", out.boxPadding+out.sepLineLength).attr("y2", y)
				.attr("stroke", out.sepLineStroke).attr("stroke-width", out.sepLineStrokeWidth);

			//label
			if(i<m.clnb()-1)
				lgg.append("text").attr("x", out.boxPadding+Math.max(out.shapeWidth, out.sepLineLength)+out.labelOffset).attr("y", y+out.shapeHeight)
				.attr("alignment-baseline", "middle")
				.text( spaceAsThousandSeparator(f( m.classifier().invertExtent(ecl)[ out.ascending?0:1 ] ) ) )
				.style("font-size", out.labelFontSize + "px").style("font-family", m.fontFamily_).style("fill", out.fontFill)
		}

		//'no data' legend box
		if(out.noData) {
			const y = out.boxPadding + (out.title? out.titleFontSize + out.boxPadding : 0) + m.clnb()*out.shapeHeight + out.boxPadding;

			//rectangle
			lgg.append("rect").attr("x", out.boxPadding).attr("y", y)
			.attr("width", out.shapeWidth).attr("height", out.shapeHeight)
			.attr("fill", m.noDataFillStyle() )
			.attr("stroke", "black").attr("stroke-width", 0.5)
			.on("mouseover", function () {
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='nd']");
				sel.style("fill", m.nutsrgSelFillSty());
				sel.attr("fill___", function (d) { select(this).attr("fill"); });
				select(this).style("fill", m.nutsrgSelFillSty());
			})
			.on("mouseout", function () {
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='nd']");
				sel.style("fill", function (d) { select(this).attr("fill___"); });
				select(this).style("fill", m.noDataFillStyle());
			});

			//'no data' label
			lgg.append("text").attr("x", out.boxPadding+out.shapeWidth+out.labelOffset).attr("y", y+out.shapeHeight*0.5)
			.attr("alignment-baseline", "middle")
			.text(out.noDataText)
			.style("font-size", out.labelFontSize + "px").style("font-family", m.fontFamily_).style("fill", out.fontFill)
		}

		//set legend box dimensions
		out.setBoxDimension();
	}

	return out;
}
