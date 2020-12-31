import { select } from "d3-selection";
import * as lg from '../core/legend';

/**
 * A legend for categorical maps
 * 
 * @param {*} map 
 */
export const legendCategorical = function (map, config) {

	//build generic legend object for the map
	const out = lg.legend(map, config);

	//@override
	out.update = function () {
		const m = out.map;
		const svg = out.svg;

		const svgMap = m.svg();

		//remove previous content
		svg.selectAll("*").remove();

		//draw legend box
		svg.append("rect")
			.attr("id", "legendBR")
			.attr("x", 0)
			.attr("y", 0)
			.attr("rx", out.boxCornerRad)
			.attr("ry", out.boxCornerRad)
			.attr("width", out.width)
			.attr("height", out.height)
			.style("fill", out.boxFill)
			.style("opacity", out.boxOpacity);

		//set font family
		svg.style("font-family", out.fontFamily);

		//draw title
		if(out.title)
			svg.append("text").attr("x", out.boxPadding).attr("y", out.boxPadding + out.titleFontSize)
			.text(out.title).style("font-size", out.titleFontSize);

		//get classes
		const ecls = Object.keys(m.classToFillStyleCT());

		//draw legend elements for classes: rectangle + label
		for(let i=0; i<ecls.length; i++) {

			//the class
			const ecl = i;
			const ecl_ = ecls[i];

			//the vertical position of the legend element
			const y = out.boxPadding + (out.title? out.titleFontSize + out.boxPadding : 0) + i*(out.shapeHeight + out.shapePadding);

			//prepare mouse over function
			const mouseoverF = function () {
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				sel.style("fill", m.nutsrgSelFillSty());
				const th = select(this);
				sel.attr("fill___", function (d) { th.attr("fill"); });
				th.style("fill", m.nutsrgSelFillSty());
			}

			//prepare mouse out function
			const mouseoutF = function () {
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				const th = select(this);
				sel.style("fill", function (d) { th.attr("fill___"); });
				th.style("fill", m.classToFillStyleCT()[ecl]);
			}

			//rectangle
			svg.append("rect").attr("x", out.boxPadding).attr("y", y)
			.attr("width", out.shapeWidth).attr("height", out.shapeHeight)
			.attr("fill", m.classToFillStyleCT()[ecl_])
			.attr("stroke", "black").attr("stroke-width", 0.5)
			.on("mouseover", mouseoverF)
			.on("mouseout", mouseoutF)

			//label
			svg.append("text").attr("x", out.boxPadding+out.shapeWidth+out.labelOffset).attr("y", y+out.shapeHeight*0.5+out.labelFontSize*0.5)
			.text( m.classToText()[ecl_] )
			.style("font-size", out.labelFontSize)
			.on("mouseover", mouseoverF)
			.on("mouseout", mouseoutF)

		}
	}

	//@override
	out.computeWidth = function () {
		//TODO make better: this is not always the real width
		return out.boxPadding * 2 + Math.max(out.titleWidth, out.shapeWidth + out.labelOffset + out.labelWrap);
	}
	//@override
	out.computeHeight = function () {
		//get number of categories
		const nb = out.map.classToFillStyleCT()? Object.keys(out.map.classToFillStyleCT()).length : 6;
		return out.boxPadding * 2 + (out.title? out.titleFontSize + out.boxPadding : 0) + nb*out.shapeHeight + (nb-1)*out.shapePadding;
	}

	return out;
}





/*
		//background rectangle
		svg.append("rect").attr("id", "legendBR").attr("x", -out.boxPadding).attr("y", -out.titleFontSize - out.boxPadding + 6)
			.attr("rx", out.boxCornerRad).attr("ry", out.boxCornerRad)
			.attr("width", out.width).attr("height", out.height)
			.style("fill", out.boxFill).style("opacity", out.boxOpacity);

		//define legend
		//see http://d3-legend.susielu.com/#color
		const d3Legend = legendColor()
			.title(out.title)
			.titleWidth(out.titleWidth)
			.useClass(true)
			.scale(cla)
			.ascending(out.ascending)
			.shapeWidth(out.shapeWidth)
			.shapeHeight(out.shapeHeight)
			.shapePadding(out.shapePadding)
			.labels(function (d) {
				return m.classToText() ? m.classToText()[claInv(d.i)] || claInv(d.i) : claInv(d.i);
			})
			.labelDelimiter(out.labelDelim)
			.labelOffset(out.labelOffset)
			.labelWrap(out.labelWrap)
			.on("cellover", function (ecl) {
				ecl = cla(ecl);
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				sel.style("fill", m.nutsrgSelFillSty());
				sel.attr("fill___", function (d) { select(this).attr("fill"); });
			})
			.on("cellout", function (ecl) {
				ecl = cla(ecl);
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				sel.style("fill", function (d) { select(this).attr("fill___"); });
			});

		//make legend
		svg.call(d3Legend);

		//apply style to legend elements
		svg.selectAll(".swatch")
			.attr("ecl", function () {
				const ecl = select(this).attr("class").replace("swatch ", "");
				if (!ecl || ecl === "nd") return "nd";
				return ecl;
			})
			.attr("fill", function () {
				const ecl = select(this).attr("class").replace("swatch ", "");
				if (!ecl || ecl === "nd") return m.noDataFillStyle() || "gray";
				return m.classToFillStyleCT()[claInv(ecl)];
			});
		svg.select(".legendTitle").style("font-size", out.titleFontSize);
		svg.selectAll("text.label").style("font-size", out.labelFontSize);
		svg.style("font-family", out.fontFamily);*/
