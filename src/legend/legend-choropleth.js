import { select } from "d3-selection";
import { format } from "d3-format";
import * as lg from '../core/legend';

/**
 * A legend for choropleth maps
 * 
 * @param {*} map 
 */
export const legendChoropleth = function (map, config) {
	config = config || {};

	//build generic legend object for the map
	const out = lg.legend(map, config);

	//@override
	out.update = function () {
		const m = out.map;
		const svgMap = m.svg();
		const svg = out.svg_;

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
		if(out.titleText)
			svg.append("text").attr("x", out.boxPadding).attr("y", out.boxPadding + out.titleFontSize)
			.text(out.titleText).style("font-size", out.titleFontSize);

		//define format for labels
		const f = format("." + out.labelDecNb + "f");

		//draw legend elements for classes: rectangle + label
		for(let i=0; i<m.clnb(); i++) {

			//the vertical position of the legend element
			const y = out.boxPadding + (out.titleText? out.titleFontSize + out.boxPadding : 0) + i*out.shapeHeight;

			//the class number, depending on order
			const ecl = out.ascending? m.clnb()-i-1 : i;

			//rectangle
			svg.append("rect").attr("x", out.boxPadding).attr("y", y)
			.attr("width", out.shapeWidth).attr("height", out.shapeHeight)
			.attr("fill", m.classToFillStyleCH()(ecl, m.clnb()))
			//.attr("ecl", ecl)
			.on("mouseover", function () {
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				sel.style("fill", m.nutsrgSelFillSty());
				sel.attr("fill___", function (d) { select(this).attr("fill"); });
				select(this).style("fill", m.nutsrgSelFillSty());
			})
			.on("mouseout", function () {
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				sel.style("fill", function (d) { select(this).attr("fill___"); });
				select(this).style("fill", m.classToFillStyleCH()(ecl, m.clnb()));
			});

			//separation line
			if(i>0)
				svg.append("line").attr("x1", out.boxPadding).attr("y1", y).attr("x2", out.boxPadding+out.shapeWidth).attr("y2", y)
				.attr("stroke", "black").attr("stroke-width", 1);

			//label
			if(i<m.clnb()-1)
				svg.append("text").attr("x", out.boxPadding+out.shapeWidth+out.labelOffset).attr("y", y+out.shapeHeight+0.5*out.labelFontSize)
				.text( f( m.classifier().invertExtent(ecl)[ out.ascending?0:1 ] ) )
				.style("font-size", out.labelFontSize);
		}
	}

	//@override
	out.computeWidth = function () {
		//TODO make better: this is not always the real width
		return out.boxPadding * 2 + Math.max(out.titleWidth, out.shapeWidth + out.labelOffset + out.labelWrap);
	}
	//@override
	out.computeHeight = function () {
		return out.boxPadding * 2 + (out.titleText? out.titleFontSize + out.boxPadding : 0) + out.shapeHeight * out.map.clnb();
	}

	return out;
}





			/*
		//define legend
		//see http://d3-legend.susielu.com/#color
		const d3Legend = legendColor()
			.title(out.titleText)
			.titleWidth(out.titleWidth)
			.useClass(true)
			.scale(m.classifier())
			.ascending(out.ascending)
			.shapeWidth(out.shapeWidth)
			.shapeHeight(out.shapeHeight)
			.shapePadding(out.shapePadding)
			.labelFormat(format(".0" + out.labelDecNb + "f"))
			//.labels(d3.legendHelpers.thresholdLabels)
			.labels(function (d) {
				if (d.i === 0)
					return "< " + d.generatedLabels[d.i].split(d.labelDelimiter)[1];
				else if (d.i === d.genLength - 1)
					return ">= " + d.generatedLabels[d.i].split(d.labelDelimiter)[0];
				else
					return d.generatedLabels[d.i]
			})
			.labelDelimiter(out.labelDelim)
			.labelOffset(out.labelOffset)
			.labelWrap(out.labelWrap)
			//.labelAlign("end") //?
			//.classPrefix("from ")
			//.orient("vertical")
			//.shape("rect")
			.on("cellover", function (ecl) {
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				sel.style("fill", m.nutsrgSelFillSty());
				sel.attr("fill___", function (d) { select(this).attr("fill"); });
			})
			.on("cellout", function (ecl) {
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
				return m.classToFillStyleCH()(ecl, m.clnb());
			})
			//.attr("stroke", "black")
			//.attr("stroke-width", 0.5)
			;
		svg.select(".legendTitle").style("font-size", out.titleFontSize);
		svg.selectAll("text.label").style("font-size", out.labelFontSize);
		svg.style("font-family", out.fontFamily);*/
