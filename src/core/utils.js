function processInsets(insets, mainSvgId, callback, parameter = null) {
    for (const geo in insets) {
        const insetGroup = insets[geo]

        if (Array.isArray(insetGroup)) {
            insetGroup.forEach((inset) => {
                // Handle nested arrays for multiple insets with the same geo
                if (Array.isArray(inset)) {
                    inset.forEach((nestedInset) => {
                        if (nestedInset.svgId_ !== mainSvgId) {
                            callback(nestedInset, parameter)
                        }
                    })
                } else {
                    if (inset.svgId_ !== mainSvgId) {
                        callback(inset, parameter)
                    }
                }
            })
        } else {
            // Apply callback to unique inset
            if (insetGroup.svgId_ !== mainSvgId) {
                callback(insetGroup, parameter)
            }
        }
    }
}

export { processInsets }
