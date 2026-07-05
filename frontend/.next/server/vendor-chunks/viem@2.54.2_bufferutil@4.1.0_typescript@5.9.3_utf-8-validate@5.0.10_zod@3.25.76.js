"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/viem@2.54.2_bufferutil@4.1.0_typescript@5.9.3_utf-8-validate@5.0.10_zod@3.25.76";
exports.ids = ["vendor-chunks/viem@2.54.2_bufferutil@4.1.0_typescript@5.9.3_utf-8-validate@5.0.10_zod@3.25.76"];
exports.modules = {

/***/ "(ssr)/./node_modules/.pnpm/viem@2.54.2_bufferutil@4.1.0_typescript@5.9.3_utf-8-validate@5.0.10_zod@3.25.76/node_modules/viem/_esm/utils/chain/defineChain.js":
/*!**************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/viem@2.54.2_bufferutil@4.1.0_typescript@5.9.3_utf-8-validate@5.0.10_zod@3.25.76/node_modules/viem/_esm/utils/chain/defineChain.js ***!
  \**************************************************************************************************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   defineChain: () => (/* binding */ defineChain),\n/* harmony export */   extendSchema: () => (/* binding */ extendSchema)\n/* harmony export */ });\nfunction defineChain(chain) {\n    const chainInstance = {\n        formatters: undefined,\n        fees: undefined,\n        serializers: undefined,\n        ...chain,\n    };\n    function extend(base) {\n        return (fnOrExtended) => {\n            const properties = (typeof fnOrExtended === 'function' ? fnOrExtended(base) : fnOrExtended);\n            const combined = { ...base, ...properties };\n            return Object.assign(combined, { extend: extend(combined) });\n        };\n    }\n    return Object.assign(chainInstance, {\n        extend: extend(chainInstance),\n    });\n}\nfunction extendSchema() {\n    return {};\n}\n//# sourceMappingURL=defineChain.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvLnBucG0vdmllbUAyLjU0LjJfYnVmZmVydXRpbEA0LjEuMF90eXBlc2NyaXB0QDUuOS4zX3V0Zi04LXZhbGlkYXRlQDUuMC4xMF96b2RAMy4yNS43Ni9ub2RlX21vZHVsZXMvdmllbS9fZXNtL3V0aWxzL2NoYWluL2RlZmluZUNoYWluLmpzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0I7QUFDL0IsNkNBQTZDLDBCQUEwQjtBQUN2RTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNPO0FBQ1A7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vc2lnbWEtcHJvdG9jb2wvLi9ub2RlX21vZHVsZXMvLnBucG0vdmllbUAyLjU0LjJfYnVmZmVydXRpbEA0LjEuMF90eXBlc2NyaXB0QDUuOS4zX3V0Zi04LXZhbGlkYXRlQDUuMC4xMF96b2RAMy4yNS43Ni9ub2RlX21vZHVsZXMvdmllbS9fZXNtL3V0aWxzL2NoYWluL2RlZmluZUNoYWluLmpzPzkwZTAiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUNoYWluKGNoYWluKSB7XG4gICAgY29uc3QgY2hhaW5JbnN0YW5jZSA9IHtcbiAgICAgICAgZm9ybWF0dGVyczogdW5kZWZpbmVkLFxuICAgICAgICBmZWVzOiB1bmRlZmluZWQsXG4gICAgICAgIHNlcmlhbGl6ZXJzOiB1bmRlZmluZWQsXG4gICAgICAgIC4uLmNoYWluLFxuICAgIH07XG4gICAgZnVuY3Rpb24gZXh0ZW5kKGJhc2UpIHtcbiAgICAgICAgcmV0dXJuIChmbk9yRXh0ZW5kZWQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BlcnRpZXMgPSAodHlwZW9mIGZuT3JFeHRlbmRlZCA9PT0gJ2Z1bmN0aW9uJyA/IGZuT3JFeHRlbmRlZChiYXNlKSA6IGZuT3JFeHRlbmRlZCk7XG4gICAgICAgICAgICBjb25zdCBjb21iaW5lZCA9IHsgLi4uYmFzZSwgLi4ucHJvcGVydGllcyB9O1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oY29tYmluZWQsIHsgZXh0ZW5kOiBleHRlbmQoY29tYmluZWQpIH0pO1xuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihjaGFpbkluc3RhbmNlLCB7XG4gICAgICAgIGV4dGVuZDogZXh0ZW5kKGNoYWluSW5zdGFuY2UpLFxuICAgIH0pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZFNjaGVtYSgpIHtcbiAgICByZXR1cm4ge307XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kZWZpbmVDaGFpbi5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/.pnpm/viem@2.54.2_bufferutil@4.1.0_typescript@5.9.3_utf-8-validate@5.0.10_zod@3.25.76/node_modules/viem/_esm/utils/chain/defineChain.js\n");

/***/ })

};
;