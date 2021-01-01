import { select } from "d3-selection";
import { format } from "d3-format";
import * as lg from '../core/legend';

/**
 * A legend for choropleth maps
 * 
 * @param {*} map 
 */
export const legendChoropleth = function (map, config) {

	//build generic legend object for the map
	const out = lg.legend(map, config);

	//@override
	out.update = function () {
		const m = out.map;
		const svgMap = m.svg();
		const lgg = out.lgg;

		//remove previous content
		lgg.selectAll("*").remove();

		//draw legend box
		lgg.append("rect")
			.attr("id", "legendBR")
			.attr("rx", out.boxCornerRad)
			.attr("ry", out.boxCornerRad)
			.style("fill", out.boxFill)
			.style("opacity", out.boxOpacity);

		//set font family
		lgg.style("font-family", out.fontFamily);

		//draw title
		if(out.title)
			lgg.append("text").attr("x", out.boxPadding).attr("y", out.boxPadding + out.titleFontSize)
			.text(out.title).style("font-size", out.titleFontSize);

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
			.attr("fill", m.classToFillStyleCH()(ecl, m.clnb()))
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
				lgg.append("line").attr("x1", out.boxPadding).attr("y1", y).attr("x2", out.boxPadding+out.shapeWidth).attr("y2", y)
				.attr("stroke", "black").attr("stroke-width", 1);

			//label
			//TODO use .attr("text-anchor", "middle")
			if(i<m.clnb()-1)
				lgg.append("text").attr("x", out.boxPadding+out.shapeWidth+out.labelOffset).attr("y", y+out.shapeHeight+0.5*out.labelFontSize)
				.text( f( m.classifier().invertExtent(ecl)[ out.ascending?0:1 ] ) )
				.style("font-size", out.labelFontSize);
		}

		//set legend box dimensions
		out.setBoxDimension();
	}

	return out;
}
