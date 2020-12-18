/**
 * The map template: only the geometrical part.
 * To be used as a base map for a statistical map.
 */

/**
 * Build an empty map template.
 * 
 * @param {*} withCenterPoints Set to true (or 1) to add regions center points to the map template, to be used for proportional symbols maps for example.
 */
export const mapTemplate = function (withCenterPoints) {

	const out = {};

	/**
	* Create attributes and set default values
	*/

	//map
	out.svgId_ = "map";
	out.svg_ = undefined;
	out.width_ = 800;
	out.height_ = 0;

	//geographical focus
	out.nutsLvl_ = 3;
	out.NUTSyear_ = 2016;
	out.geo_ = "EUR";
	out.proj_ = "3035";
	out.scale_ = "20M"; //TODO better choose automatically ?
	out.geoCenter_ = undefined;
	out.pixSize_ = undefined;

	//map title
	out.title_ = "";
	out.titleFontSize_ = 25;
	out.titleFill_ = "black";
	out.titlePosition_ = undefined;
	out.titleFontFamily_ = "Helvetica, Arial, sans-serif";
	out.titleFontWeight_ = "bold";

	//template default style
	//nuts
	out.nutsrgFillStyle_ = "#eee";
	out.nutsrgSelFillSty_ = "purple";
	out.nutsbnStroke_ = { 0: "#777", 1: "#777", 2: "#777", 3: "#777", oth: "#444", co: "#1f78b4" };
	out.nutsbnStrokeWidth_ = { 0: 1, 1: 0.2, 2: 0.2, 3: 0.2, oth: 1, co: 1 };
	//countries
	out.cntrgFillStyle_ = "lightgray";
	out.cntrgSelFillSty_ = "darkgray";
	out.cntbnStroke_ = { def: "#777", co: "#1f78b4" };
	out.cntbnStrokeWidth_ = { def: 1, co: 1 };
	//sea
	out.seaFillStyle_ = "#b3cde3";
	out.drawCoastalMargin_ = true;
	out.coastalMarginColor_ = "white";
	out.coastalMarginWidth_ = 12;
	out.coastalMarginStdDev_ = 12;
	//graticule
	out.drawGraticule_ = true;
	out.graticuleStroke_ = "gray";
	out.graticuleStrokeWidth_ = 1;

	//default copyright and disclaimer text
	out.bottomText_ = "Administrative boundaries: \u00A9EuroGeographics \u00A9UN-FAO \u00A9INSTAT \u00A9Turkstat"; //"(C)EuroGeographics (C)UN-FAO (C)Turkstat";
	out.botTxtFontSize_ = 12;
	out.botTxtFill_ = "black";
	out.botTxtFontFamily_ = "Helvetica, Arial, sans-serif";
	out.botTxtPadding_ = 10;
	out.botTxtTooltipTxt_ = "The designations employed and the presentation of material on this map do not imply the expression of any opinion whatsoever on the part of the European Union concerning the legal status of any country, territory, city or area or of its authorities, or concerning the delimitation of its frontiers or boundaries. Kosovo*: This designation is without prejudice to positions on status, and is in line with UNSCR 1244/1999 and the ICJ Opinion on the Kosovo declaration of independence. Palestine*: This designation shall not be construed as recognition of a State of Palestine and is without prejudice to the individual positions of the Member States on this issue.";

	out.zoomExtent_ = [1, 5];
	out.nuts2jsonBaseURL_ = "https://raw.githubusercontent.com/eurostat/Nuts2json/master/pub/v1/";







    return out;
}
