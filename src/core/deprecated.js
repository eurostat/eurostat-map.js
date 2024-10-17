// to keep track of deprecated functions whilst keeping the current version clean.
// remove when completely phased out.

export const defineDeprecatedFunctions = (out) => {
    // @DEPRECATED
    out.seaFillStyle = function (v) {
        console.warn('seaFillStyle() is now DEPRECATED, please use the .em-sea CSS class')
        return out
    }
    // @DEPRECATED
    out.cntrgFillStyle = function (v) {
        console.warn('cntrgFillStyle() is now DEPRECATED, please use the .em-cntrg CSS class')
        return out
    }
    // @DEPRECATED
    out.nutsrgFillStyle = function (v) {
        console.warn('nutsrgFillStyle() is now DEPRECATED, please use the .em-nutsrg CSS class')
        return out
    }
    // @DEPRECATED
    out.nutsbnStroke = function (v) {
        console.warn('nutsbnStroke() is now DEPRECATED, please use the .bn_0, .bn_1, .bn_2, .bn_3 CSS classes')
        return out
    }
    // @DEPRECATED
    out.nutsbnStrokeWidth = function (v) {
        console.warn('nutsbnStrokeWidth() is now DEPRECATED, please use the .bn_0, .bn_1, .bn_2, .bn_3 CSS classes')
        return out
    }
    out.graticuleStroke = function () {
        console.warn('graticuleStroke() is now DEPRECATED, please use the .em-graticule CSS class')
        return out
    }
    out.graticuleStrokeWidth = function () {
        console.warn('graticuleStrokeWidth() is now DEPRECATED, please use the .em-graticule CSS class')
        return out
    }
    out.nutsrgSelFillSty = function (v) {
        console.warn('nutsrgSelFillSty() is now DEPRECATED, please use hoverColor() instead')
        out.hoverColor_ = v
        return out
    }
    // @DEPRECATED
    out.tooltipText = function (v) {
        console.warn(
            'map.tooltipText() is now deprecated. Please use map.tooltip(config.textFunction) instead. See API reference for details.'
        )
        out.tooltip_.textFunction = v
        return out
    }
}
