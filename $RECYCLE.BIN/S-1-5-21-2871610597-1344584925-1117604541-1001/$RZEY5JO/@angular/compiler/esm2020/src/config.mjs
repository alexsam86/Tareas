/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ViewEncapsulation } from './core';
import { noUndefined } from './util';
export class CompilerConfig {
    constructor({ defaultEncapsulation = ViewEncapsulation.Emulated, useJit = true, jitDevMode = false, missingTranslation = null, preserveWhitespaces, strictInjectionParameters } = {}) {
        this.defaultEncapsulation = defaultEncapsulation;
        this.useJit = !!useJit;
        this.jitDevMode = !!jitDevMode;
        this.missingTranslation = missingTranslation;
        this.preserveWhitespaces = preserveWhitespacesDefault(noUndefined(preserveWhitespaces));
        this.strictInjectionParameters = strictInjectionParameters === true;
    }
}
export function preserveWhitespacesDefault(preserveWhitespacesOption, defaultSetting = false) {
    return preserveWhitespacesOption === null ? defaultSetting : preserveWhitespacesOption;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQTZCLGlCQUFpQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ3JFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFbkMsTUFBTSxPQUFPLGNBQWM7SUFRekIsWUFBWSxFQUNWLG9CQUFvQixHQUFHLGlCQUFpQixDQUFDLFFBQVEsRUFDakQsTUFBTSxHQUFHLElBQUksRUFDYixVQUFVLEdBQUcsS0FBSyxFQUNsQixrQkFBa0IsR0FBRyxJQUFJLEVBQ3pCLG1CQUFtQixFQUNuQix5QkFBeUIsS0FRdkIsRUFBRTtRQUNKLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxvQkFBb0IsQ0FBQztRQUNqRCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDdkIsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDO1FBQy9CLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQztRQUM3QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsMEJBQTBCLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztRQUN4RixJQUFJLENBQUMseUJBQXlCLEdBQUcseUJBQXlCLEtBQUssSUFBSSxDQUFDO0lBQ3RFLENBQUM7Q0FDRjtBQUVELE1BQU0sVUFBVSwwQkFBMEIsQ0FDdEMseUJBQXVDLEVBQUUsY0FBYyxHQUFHLEtBQUs7SUFDakUsT0FBTyx5QkFBeUIsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMseUJBQXlCLENBQUM7QUFDekYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge01pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5LCBWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi9jb3JlJztcbmltcG9ydCB7bm9VbmRlZmluZWR9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBjbGFzcyBDb21waWxlckNvbmZpZyB7XG4gIHB1YmxpYyBkZWZhdWx0RW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb258bnVsbDtcbiAgcHVibGljIHVzZUppdDogYm9vbGVhbjtcbiAgcHVibGljIGppdERldk1vZGU6IGJvb2xlYW47XG4gIHB1YmxpYyBtaXNzaW5nVHJhbnNsYXRpb246IE1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5fG51bGw7XG4gIHB1YmxpYyBwcmVzZXJ2ZVdoaXRlc3BhY2VzOiBib29sZWFuO1xuICBwdWJsaWMgc3RyaWN0SW5qZWN0aW9uUGFyYW1ldGVyczogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3Rvcih7XG4gICAgZGVmYXVsdEVuY2Fwc3VsYXRpb24gPSBWaWV3RW5jYXBzdWxhdGlvbi5FbXVsYXRlZCxcbiAgICB1c2VKaXQgPSB0cnVlLFxuICAgIGppdERldk1vZGUgPSBmYWxzZSxcbiAgICBtaXNzaW5nVHJhbnNsYXRpb24gPSBudWxsLFxuICAgIHByZXNlcnZlV2hpdGVzcGFjZXMsXG4gICAgc3RyaWN0SW5qZWN0aW9uUGFyYW1ldGVyc1xuICB9OiB7XG4gICAgZGVmYXVsdEVuY2Fwc3VsYXRpb24/OiBWaWV3RW5jYXBzdWxhdGlvbixcbiAgICB1c2VKaXQ/OiBib29sZWFuLFxuICAgIGppdERldk1vZGU/OiBib29sZWFuLFxuICAgIG1pc3NpbmdUcmFuc2xhdGlvbj86IE1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5fG51bGwsXG4gICAgcHJlc2VydmVXaGl0ZXNwYWNlcz86IGJvb2xlYW4sXG4gICAgc3RyaWN0SW5qZWN0aW9uUGFyYW1ldGVycz86IGJvb2xlYW4sXG4gIH0gPSB7fSkge1xuICAgIHRoaXMuZGVmYXVsdEVuY2Fwc3VsYXRpb24gPSBkZWZhdWx0RW5jYXBzdWxhdGlvbjtcbiAgICB0aGlzLnVzZUppdCA9ICEhdXNlSml0O1xuICAgIHRoaXMuaml0RGV2TW9kZSA9ICEhaml0RGV2TW9kZTtcbiAgICB0aGlzLm1pc3NpbmdUcmFuc2xhdGlvbiA9IG1pc3NpbmdUcmFuc2xhdGlvbjtcbiAgICB0aGlzLnByZXNlcnZlV2hpdGVzcGFjZXMgPSBwcmVzZXJ2ZVdoaXRlc3BhY2VzRGVmYXVsdChub1VuZGVmaW5lZChwcmVzZXJ2ZVdoaXRlc3BhY2VzKSk7XG4gICAgdGhpcy5zdHJpY3RJbmplY3Rpb25QYXJhbWV0ZXJzID0gc3RyaWN0SW5qZWN0aW9uUGFyYW1ldGVycyA9PT0gdHJ1ZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJlc2VydmVXaGl0ZXNwYWNlc0RlZmF1bHQoXG4gICAgcHJlc2VydmVXaGl0ZXNwYWNlc09wdGlvbjogYm9vbGVhbnxudWxsLCBkZWZhdWx0U2V0dGluZyA9IGZhbHNlKTogYm9vbGVhbiB7XG4gIHJldHVybiBwcmVzZXJ2ZVdoaXRlc3BhY2VzT3B0aW9uID09PSBudWxsID8gZGVmYXVsdFNldHRpbmcgOiBwcmVzZXJ2ZVdoaXRlc3BhY2VzT3B0aW9uO1xufVxuIl19