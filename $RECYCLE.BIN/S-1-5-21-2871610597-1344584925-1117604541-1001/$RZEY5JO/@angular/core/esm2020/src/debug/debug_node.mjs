/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertTNodeForLView } from '../render3/assert';
import { getLContext } from '../render3/context_discovery';
import { CONTAINER_HEADER_OFFSET, NATIVE } from '../render3/interfaces/container';
import { isComponentHost, isLContainer } from '../render3/interfaces/type_checks';
import { DECLARATION_COMPONENT_VIEW, PARENT, T_HOST, TVIEW } from '../render3/interfaces/view';
import { getComponent, getContext, getInjectionTokens, getInjector, getListeners, getLocalRefs, getOwningComponent } from '../render3/util/discovery_utils';
import { INTERPOLATION_DELIMITER } from '../render3/util/misc_utils';
import { renderStringify } from '../render3/util/stringify_utils';
import { getComponentLViewByIndex, getNativeByTNodeOrNull } from '../render3/util/view_utils';
import { assertDomNode } from '../util/assert';
/**
 * @publicApi
 */
export class DebugEventListener {
    constructor(name, callback) {
        this.name = name;
        this.callback = callback;
    }
}
/**
 * @publicApi
 */
export function asNativeElements(debugEls) {
    return debugEls.map((el) => el.nativeElement);
}
/**
 * @publicApi
 */
export class DebugNode {
    constructor(nativeNode) {
        this.nativeNode = nativeNode;
    }
    /**
     * The `DebugElement` parent. Will be `null` if this is the root element.
     */
    get parent() {
        const parent = this.nativeNode.parentNode;
        return parent ? new DebugElement(parent) : null;
    }
    /**
     * The host dependency injector. For example, the root element's component instance injector.
     */
    get injector() {
        return getInjector(this.nativeNode);
    }
    /**
     * The element's own component instance, if it has one.
     */
    get componentInstance() {
        const nativeElement = this.nativeNode;
        return nativeElement &&
            (getComponent(nativeElement) || getOwningComponent(nativeElement));
    }
    /**
     * An object that provides parent context for this element. Often an ancestor component instance
     * that governs this element.
     *
     * When an element is repeated within *ngFor, the context is an `NgForOf` whose `$implicit`
     * property is the value of the row instance value. For example, the `hero` in `*ngFor="let hero
     * of heroes"`.
     */
    get context() {
        return getComponent(this.nativeNode) || getContext(this.nativeNode);
    }
    /**
     * The callbacks attached to the component's @Output properties and/or the element's event
     * properties.
     */
    get listeners() {
        return getListeners(this.nativeNode).filter(listener => listener.type === 'dom');
    }
    /**
     * Dictionary of objects associated with template local variables (e.g. #foo), keyed by the local
     * variable name.
     */
    get references() {
        return getLocalRefs(this.nativeNode);
    }
    /**
     * This component's injector lookup tokens. Includes the component itself plus the tokens that the
     * component lists in its providers metadata.
     */
    get providerTokens() {
        return getInjectionTokens(this.nativeNode);
    }
}
/**
 * @publicApi
 *
 * @see [Component testing scenarios](guide/testing-components-scenarios)
 * @see [Basics of testing components](guide/testing-components-basics)
 * @see [Testing utility APIs](guide/testing-utility-apis)
 */
export class DebugElement extends DebugNode {
    constructor(nativeNode) {
        ngDevMode && assertDomNode(nativeNode);
        super(nativeNode);
    }
    /**
     * The underlying DOM element at the root of the component.
     */
    get nativeElement() {
        return this.nativeNode.nodeType == Node.ELEMENT_NODE ? this.nativeNode : null;
    }
    /**
     * The element tag name, if it is an element.
     */
    get name() {
        const context = getLContext(this.nativeNode);
        const lView = context ? context.lView : null;
        if (lView !== null) {
            const tData = lView[TVIEW].data;
            const tNode = tData[context.nodeIndex];
            return tNode.value;
        }
        else {
            return this.nativeNode.nodeName;
        }
    }
    /**
     *  Gets a map of property names to property values for an element.
     *
     *  This map includes:
     *  - Regular property bindings (e.g. `[id]="id"`)
     *  - Host property bindings (e.g. `host: { '[id]': "id" }`)
     *  - Interpolated property bindings (e.g. `id="{{ value }}")
     *
     *  It does not include:
     *  - input property bindings (e.g. `[myCustomInput]="value"`)
     *  - attribute bindings (e.g. `[attr.role]="menu"`)
     */
    get properties() {
        const context = getLContext(this.nativeNode);
        const lView = context ? context.lView : null;
        if (lView === null) {
            return {};
        }
        const tData = lView[TVIEW].data;
        const tNode = tData[context.nodeIndex];
        const properties = {};
        // Collect properties from the DOM.
        copyDomProperties(this.nativeElement, properties);
        // Collect properties from the bindings. This is needed for animation renderer which has
        // synthetic properties which don't get reflected into the DOM.
        collectPropertyBindings(properties, tNode, lView, tData);
        return properties;
    }
    /**
     *  A map of attribute names to attribute values for an element.
     */
    get attributes() {
        const attributes = {};
        const element = this.nativeElement;
        if (!element) {
            return attributes;
        }
        const context = getLContext(element);
        const lView = context ? context.lView : null;
        if (lView === null) {
            return {};
        }
        const tNodeAttrs = lView[TVIEW].data[context.nodeIndex].attrs;
        const lowercaseTNodeAttrs = [];
        // For debug nodes we take the element's attribute directly from the DOM since it allows us
        // to account for ones that weren't set via bindings (e.g. ViewEngine keeps track of the ones
        // that are set through `Renderer2`). The problem is that the browser will lowercase all names,
        // however since we have the attributes already on the TNode, we can preserve the case by going
        // through them once, adding them to the `attributes` map and putting their lower-cased name
        // into an array. Afterwards when we're going through the native DOM attributes, we can check
        // whether we haven't run into an attribute already through the TNode.
        if (tNodeAttrs) {
            let i = 0;
            while (i < tNodeAttrs.length) {
                const attrName = tNodeAttrs[i];
                // Stop as soon as we hit a marker. We only care about the regular attributes. Everything
                // else will be handled below when we read the final attributes off the DOM.
                if (typeof attrName !== 'string')
                    break;
                const attrValue = tNodeAttrs[i + 1];
                attributes[attrName] = attrValue;
                lowercaseTNodeAttrs.push(attrName.toLowerCase());
                i += 2;
            }
        }
        const eAttrs = element.attributes;
        for (let i = 0; i < eAttrs.length; i++) {
            const attr = eAttrs[i];
            const lowercaseName = attr.name.toLowerCase();
            // Make sure that we don't assign the same attribute both in its
            // case-sensitive form and the lower-cased one from the browser.
            if (lowercaseTNodeAttrs.indexOf(lowercaseName) === -1) {
                // Save the lowercase name to align the behavior between browsers.
                // IE preserves the case, while all other browser convert it to lower case.
                attributes[lowercaseName] = attr.value;
            }
        }
        return attributes;
    }
    /**
     * The inline styles of the DOM element.
     *
     * Will be `null` if there is no `style` property on the underlying DOM element.
     *
     * @see [ElementCSSInlineStyle](https://developer.mozilla.org/en-US/docs/Web/API/ElementCSSInlineStyle/style)
     */
    get styles() {
        if (this.nativeElement && this.nativeElement.style) {
            return this.nativeElement.style;
        }
        return {};
    }
    /**
     * A map containing the class names on the element as keys.
     *
     * This map is derived from the `className` property of the DOM element.
     *
     * Note: The values of this object will always be `true`. The class key will not appear in the KV
     * object if it does not exist on the element.
     *
     * @see [Element.className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className)
     */
    get classes() {
        const result = {};
        const element = this.nativeElement;
        // SVG elements return an `SVGAnimatedString` instead of a plain string for the `className`.
        const className = element.className;
        const classes = typeof className !== 'string' ? className.baseVal.split(' ') : className.split(' ');
        classes.forEach((value) => result[value] = true);
        return result;
    }
    /**
     * The `childNodes` of the DOM element as a `DebugNode` array.
     *
     * @see [Node.childNodes](https://developer.mozilla.org/en-US/docs/Web/API/Node/childNodes)
     */
    get childNodes() {
        const childNodes = this.nativeNode.childNodes;
        const children = [];
        for (let i = 0; i < childNodes.length; i++) {
            const element = childNodes[i];
            children.push(getDebugNode(element));
        }
        return children;
    }
    /**
     * The immediate `DebugElement` children. Walk the tree by descending through `children`.
     */
    get children() {
        const nativeElement = this.nativeElement;
        if (!nativeElement)
            return [];
        const childNodes = nativeElement.children;
        const children = [];
        for (let i = 0; i < childNodes.length; i++) {
            const element = childNodes[i];
            children.push(getDebugNode(element));
        }
        return children;
    }
    /**
     * @returns the first `DebugElement` that matches the predicate at any depth in the subtree.
     */
    query(predicate) {
        const results = this.queryAll(predicate);
        return results[0] || null;
    }
    /**
     * @returns All `DebugElement` matches for the predicate at any depth in the subtree.
     */
    queryAll(predicate) {
        const matches = [];
        _queryAll(this, predicate, matches, true);
        return matches;
    }
    /**
     * @returns All `DebugNode` matches for the predicate at any depth in the subtree.
     */
    queryAllNodes(predicate) {
        const matches = [];
        _queryAll(this, predicate, matches, false);
        return matches;
    }
    /**
     * Triggers the event by its name if there is a corresponding listener in the element's
     * `listeners` collection.
     *
     * If the event lacks a listener or there's some other problem, consider
     * calling `nativeElement.dispatchEvent(eventObject)`.
     *
     * @param eventName The name of the event to trigger
     * @param eventObj The _event object_ expected by the handler
     *
     * @see [Testing components scenarios](guide/testing-components-scenarios#trigger-event-handler)
     */
    triggerEventHandler(eventName, eventObj) {
        const node = this.nativeNode;
        const invokedListeners = [];
        this.listeners.forEach(listener => {
            if (listener.name === eventName) {
                const callback = listener.callback;
                callback.call(node, eventObj);
                invokedListeners.push(callback);
            }
        });
        // We need to check whether `eventListeners` exists, because it's something
        // that Zone.js only adds to `EventTarget` in browser environments.
        if (typeof node.eventListeners === 'function') {
            // Note that in Ivy we wrap event listeners with a call to `event.preventDefault` in some
            // cases. We use '__ngUnwrap__' as a special token that gives us access to the actual event
            // listener.
            node.eventListeners(eventName).forEach((listener) => {
                // In order to ensure that we can detect the special __ngUnwrap__ token described above, we
                // use `toString` on the listener and see if it contains the token. We use this approach to
                // ensure that it still worked with compiled code since it cannot remove or rename string
                // literals. We also considered using a special function name (i.e. if(listener.name ===
                // special)) but that was more cumbersome and we were also concerned the compiled code could
                // strip the name, turning the condition in to ("" === "") and always returning true.
                if (listener.toString().indexOf('__ngUnwrap__') !== -1) {
                    const unwrappedListener = listener('__ngUnwrap__');
                    return invokedListeners.indexOf(unwrappedListener) === -1 &&
                        unwrappedListener.call(node, eventObj);
                }
            });
        }
    }
}
function copyDomProperties(element, properties) {
    if (element) {
        // Skip own properties (as those are patched)
        let obj = Object.getPrototypeOf(element);
        const NodePrototype = Node.prototype;
        while (obj !== null && obj !== NodePrototype) {
            const descriptors = Object.getOwnPropertyDescriptors(obj);
            for (let key in descriptors) {
                if (!key.startsWith('__') && !key.startsWith('on')) {
                    // don't include properties starting with `__` and `on`.
                    // `__` are patched values which should not be included.
                    // `on` are listeners which also should not be included.
                    const value = element[key];
                    if (isPrimitiveValue(value)) {
                        properties[key] = value;
                    }
                }
            }
            obj = Object.getPrototypeOf(obj);
        }
    }
}
function isPrimitiveValue(value) {
    return typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' ||
        value === null;
}
function _queryAll(parentElement, predicate, matches, elementsOnly) {
    const context = getLContext(parentElement.nativeNode);
    const lView = context ? context.lView : null;
    if (lView !== null) {
        const parentTNode = lView[TVIEW].data[context.nodeIndex];
        _queryNodeChildren(parentTNode, lView, predicate, matches, elementsOnly, parentElement.nativeNode);
    }
    else {
        // If the context is null, then `parentElement` was either created with Renderer2 or native DOM
        // APIs.
        _queryNativeNodeDescendants(parentElement.nativeNode, predicate, matches, elementsOnly);
    }
}
/**
 * Recursively match the current TNode against the predicate, and goes on with the next ones.
 *
 * @param tNode the current TNode
 * @param lView the LView of this TNode
 * @param predicate the predicate to match
 * @param matches the list of positive matches
 * @param elementsOnly whether only elements should be searched
 * @param rootNativeNode the root native node on which predicate should not be matched
 */
function _queryNodeChildren(tNode, lView, predicate, matches, elementsOnly, rootNativeNode) {
    ngDevMode && assertTNodeForLView(tNode, lView);
    const nativeNode = getNativeByTNodeOrNull(tNode, lView);
    // For each type of TNode, specific logic is executed.
    if (tNode.type & (3 /* TNodeType.AnyRNode */ | 8 /* TNodeType.ElementContainer */)) {
        // Case 1: the TNode is an element
        // The native node has to be checked.
        _addQueryMatch(nativeNode, predicate, matches, elementsOnly, rootNativeNode);
        if (isComponentHost(tNode)) {
            // If the element is the host of a component, then all nodes in its view have to be processed.
            // Note: the component's content (tNode.child) will be processed from the insertion points.
            const componentView = getComponentLViewByIndex(tNode.index, lView);
            if (componentView && componentView[TVIEW].firstChild) {
                _queryNodeChildren(componentView[TVIEW].firstChild, componentView, predicate, matches, elementsOnly, rootNativeNode);
            }
        }
        else {
            if (tNode.child) {
                // Otherwise, its children have to be processed.
                _queryNodeChildren(tNode.child, lView, predicate, matches, elementsOnly, rootNativeNode);
            }
            // We also have to query the DOM directly in order to catch elements inserted through
            // Renderer2. Note that this is __not__ optimal, because we're walking similar trees multiple
            // times. ViewEngine could do it more efficiently, because all the insertions go through
            // Renderer2, however that's not the case in Ivy. This approach is being used because:
            // 1. Matching the ViewEngine behavior would mean potentially introducing a dependency
            //    from `Renderer2` to Ivy which could bring Ivy code into ViewEngine.
            // 2. It allows us to capture nodes that were inserted directly via the DOM.
            nativeNode && _queryNativeNodeDescendants(nativeNode, predicate, matches, elementsOnly);
        }
        // In all cases, if a dynamic container exists for this node, each view inside it has to be
        // processed.
        const nodeOrContainer = lView[tNode.index];
        if (isLContainer(nodeOrContainer)) {
            _queryNodeChildrenInContainer(nodeOrContainer, predicate, matches, elementsOnly, rootNativeNode);
        }
    }
    else if (tNode.type & 4 /* TNodeType.Container */) {
        // Case 2: the TNode is a container
        // The native node has to be checked.
        const lContainer = lView[tNode.index];
        _addQueryMatch(lContainer[NATIVE], predicate, matches, elementsOnly, rootNativeNode);
        // Each view inside the container has to be processed.
        _queryNodeChildrenInContainer(lContainer, predicate, matches, elementsOnly, rootNativeNode);
    }
    else if (tNode.type & 16 /* TNodeType.Projection */) {
        // Case 3: the TNode is a projection insertion point (i.e. a <ng-content>).
        // The nodes projected at this location all need to be processed.
        const componentView = lView[DECLARATION_COMPONENT_VIEW];
        const componentHost = componentView[T_HOST];
        const head = componentHost.projection[tNode.projection];
        if (Array.isArray(head)) {
            for (let nativeNode of head) {
                _addQueryMatch(nativeNode, predicate, matches, elementsOnly, rootNativeNode);
            }
        }
        else if (head) {
            const nextLView = componentView[PARENT];
            const nextTNode = nextLView[TVIEW].data[head.index];
            _queryNodeChildren(nextTNode, nextLView, predicate, matches, elementsOnly, rootNativeNode);
        }
    }
    else if (tNode.child) {
        // Case 4: the TNode is a view.
        _queryNodeChildren(tNode.child, lView, predicate, matches, elementsOnly, rootNativeNode);
    }
    // We don't want to go to the next sibling of the root node.
    if (rootNativeNode !== nativeNode) {
        // To determine the next node to be processed, we need to use the next or the projectionNext
        // link, depending on whether the current node has been projected.
        const nextTNode = (tNode.flags & 4 /* TNodeFlags.isProjected */) ? tNode.projectionNext : tNode.next;
        if (nextTNode) {
            _queryNodeChildren(nextTNode, lView, predicate, matches, elementsOnly, rootNativeNode);
        }
    }
}
/**
 * Process all TNodes in a given container.
 *
 * @param lContainer the container to be processed
 * @param predicate the predicate to match
 * @param matches the list of positive matches
 * @param elementsOnly whether only elements should be searched
 * @param rootNativeNode the root native node on which predicate should not be matched
 */
function _queryNodeChildrenInContainer(lContainer, predicate, matches, elementsOnly, rootNativeNode) {
    for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
        const childView = lContainer[i];
        const firstChild = childView[TVIEW].firstChild;
        if (firstChild) {
            _queryNodeChildren(firstChild, childView, predicate, matches, elementsOnly, rootNativeNode);
        }
    }
}
/**
 * Match the current native node against the predicate.
 *
 * @param nativeNode the current native node
 * @param predicate the predicate to match
 * @param matches the list of positive matches
 * @param elementsOnly whether only elements should be searched
 * @param rootNativeNode the root native node on which predicate should not be matched
 */
function _addQueryMatch(nativeNode, predicate, matches, elementsOnly, rootNativeNode) {
    if (rootNativeNode !== nativeNode) {
        const debugNode = getDebugNode(nativeNode);
        if (!debugNode) {
            return;
        }
        // Type of the "predicate and "matches" array are set based on the value of
        // the "elementsOnly" parameter. TypeScript is not able to properly infer these
        // types with generics, so we manually cast the parameters accordingly.
        if (elementsOnly && (debugNode instanceof DebugElement) && predicate(debugNode) &&
            matches.indexOf(debugNode) === -1) {
            matches.push(debugNode);
        }
        else if (!elementsOnly && predicate(debugNode) &&
            matches.indexOf(debugNode) === -1) {
            matches.push(debugNode);
        }
    }
}
/**
 * Match all the descendants of a DOM node against a predicate.
 *
 * @param nativeNode the current native node
 * @param predicate the predicate to match
 * @param matches the list where matches are stored
 * @param elementsOnly whether only elements should be searched
 */
function _queryNativeNodeDescendants(parentNode, predicate, matches, elementsOnly) {
    const nodes = parentNode.childNodes;
    const length = nodes.length;
    for (let i = 0; i < length; i++) {
        const node = nodes[i];
        const debugNode = getDebugNode(node);
        if (debugNode) {
            if (elementsOnly && (debugNode instanceof DebugElement) && predicate(debugNode) &&
                matches.indexOf(debugNode) === -1) {
                matches.push(debugNode);
            }
            else if (!elementsOnly && predicate(debugNode) &&
                matches.indexOf(debugNode) === -1) {
                matches.push(debugNode);
            }
            _queryNativeNodeDescendants(node, predicate, matches, elementsOnly);
        }
    }
}
/**
 * Iterates through the property bindings for a given node and generates
 * a map of property names to values. This map only contains property bindings
 * defined in templates, not in host bindings.
 */
function collectPropertyBindings(properties, tNode, lView, tData) {
    let bindingIndexes = tNode.propertyBindings;
    if (bindingIndexes !== null) {
        for (let i = 0; i < bindingIndexes.length; i++) {
            const bindingIndex = bindingIndexes[i];
            const propMetadata = tData[bindingIndex];
            const metadataParts = propMetadata.split(INTERPOLATION_DELIMITER);
            const propertyName = metadataParts[0];
            if (metadataParts.length > 1) {
                let value = metadataParts[1];
                for (let j = 1; j < metadataParts.length - 1; j++) {
                    value += renderStringify(lView[bindingIndex + j - 1]) + metadataParts[j + 1];
                }
                properties[propertyName] = value;
            }
            else {
                properties[propertyName] = lView[bindingIndex];
            }
        }
    }
}
// Need to keep the nodes in a global Map so that multiple angular apps are supported.
const _nativeNodeToDebugNode = new Map();
const NG_DEBUG_PROPERTY = '__ng_debug__';
/**
 * @publicApi
 */
export function getDebugNode(nativeNode) {
    if (nativeNode instanceof Node) {
        if (!(nativeNode.hasOwnProperty(NG_DEBUG_PROPERTY))) {
            nativeNode[NG_DEBUG_PROPERTY] = nativeNode.nodeType == Node.ELEMENT_NODE ?
                new DebugElement(nativeNode) :
                new DebugNode(nativeNode);
        }
        return nativeNode[NG_DEBUG_PROPERTY];
    }
    return null;
}
// TODO: cleanup all references to this function and remove it.
export function getDebugNodeR2(_nativeNode) {
    return null;
}
export function getAllDebugNodes() {
    return Array.from(_nativeNodeToDebugNode.values());
}
export function indexDebugNode(node) {
    _nativeNodeToDebugNode.set(node.nativeNode, node);
}
export function removeDebugNodeFromIndex(node) {
    _nativeNodeToDebugNode.delete(node.nativeNode);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3pELE9BQU8sRUFBQyx1QkFBdUIsRUFBYyxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUU1RixPQUFPLEVBQUMsZUFBZSxFQUFFLFlBQVksRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FBQ2hGLE9BQU8sRUFBQywwQkFBMEIsRUFBUyxNQUFNLEVBQUUsTUFBTSxFQUFTLEtBQUssRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzNHLE9BQU8sRUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLGtCQUFrQixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDMUosT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDbkUsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ2hFLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzVGLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUU3Qzs7R0FFRztBQUNILE1BQU0sT0FBTyxrQkFBa0I7SUFDN0IsWUFBbUIsSUFBWSxFQUFTLFFBQWtCO1FBQXZDLFNBQUksR0FBSixJQUFJLENBQVE7UUFBUyxhQUFRLEdBQVIsUUFBUSxDQUFVO0lBQUcsQ0FBQztDQUMvRDtBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUFDLFFBQXdCO0lBQ3ZELE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ2hELENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sT0FBTyxTQUFTO0lBTXBCLFlBQVksVUFBZ0I7UUFDMUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFDL0IsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxNQUFNO1FBQ1IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFxQixDQUFDO1FBQ3JELE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ2xELENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksUUFBUTtRQUNWLE9BQU8sV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLGlCQUFpQjtRQUNuQixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3RDLE9BQU8sYUFBYTtZQUNoQixDQUFDLFlBQVksQ0FBQyxhQUF3QixDQUFDLElBQUksa0JBQWtCLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILElBQUksT0FBTztRQUNULE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFxQixDQUFDLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFxQixDQUFDLENBQUM7SUFDNUYsQ0FBQztJQUVEOzs7T0FHRztJQUNILElBQUksU0FBUztRQUNYLE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFxQixDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQztJQUM5RixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBSSxVQUFVO1FBQ1osT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUFJLGNBQWM7UUFDaEIsT0FBTyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsVUFBcUIsQ0FBQyxDQUFDO0lBQ3hELENBQUM7Q0FDRjtBQUVEOzs7Ozs7R0FNRztBQUNILE1BQU0sT0FBTyxZQUFhLFNBQVEsU0FBUztJQUN6QyxZQUFZLFVBQW1CO1FBQzdCLFNBQVMsSUFBSSxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdkMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksYUFBYTtRQUNmLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQXFCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUMzRixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLElBQUk7UUFDTixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBRSxDQUFDO1FBQzlDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBRTdDLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtZQUNsQixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ2hDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFVLENBQUM7WUFDaEQsT0FBTyxLQUFLLENBQUMsS0FBTSxDQUFDO1NBQ3JCO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO1NBQ2pDO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsSUFBSSxVQUFVO1FBQ1osTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUUsQ0FBQztRQUM5QyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUU3QyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7WUFDbEIsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUVELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDaEMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQVUsQ0FBQztRQUVoRCxNQUFNLFVBQVUsR0FBNEIsRUFBRSxDQUFDO1FBQy9DLG1DQUFtQztRQUNuQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ2xELHdGQUF3RjtRQUN4RiwrREFBK0Q7UUFDL0QsdUJBQXVCLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekQsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxVQUFVO1FBQ1osTUFBTSxVQUFVLEdBQWlDLEVBQUUsQ0FBQztRQUNwRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBRW5DLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDWixPQUFPLFVBQVUsQ0FBQztTQUNuQjtRQUVELE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUUsQ0FBQztRQUN0QyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUU3QyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7WUFDbEIsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUVELE1BQU0sVUFBVSxHQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBVyxDQUFDLEtBQUssQ0FBQztRQUN6RSxNQUFNLG1CQUFtQixHQUFhLEVBQUUsQ0FBQztRQUV6QywyRkFBMkY7UUFDM0YsNkZBQTZGO1FBQzdGLCtGQUErRjtRQUMvRiwrRkFBK0Y7UUFDL0YsNEZBQTRGO1FBQzVGLDZGQUE2RjtRQUM3RixzRUFBc0U7UUFDdEUsSUFBSSxVQUFVLEVBQUU7WUFDZCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDVixPQUFPLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFO2dCQUM1QixNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRS9CLHlGQUF5RjtnQkFDekYsNEVBQTRFO2dCQUM1RSxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVE7b0JBQUUsTUFBTTtnQkFFeEMsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDcEMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLFNBQW1CLENBQUM7Z0JBQzNDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztnQkFFakQsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNSO1NBQ0Y7UUFFRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBQ2xDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3RDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBRTlDLGdFQUFnRTtZQUNoRSxnRUFBZ0U7WUFDaEUsSUFBSSxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQ3JELGtFQUFrRTtnQkFDbEUsMkVBQTJFO2dCQUMzRSxVQUFVLENBQUMsYUFBYSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQzthQUN4QztTQUNGO1FBRUQsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILElBQUksTUFBTTtRQUNSLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSyxJQUFJLENBQUMsYUFBNkIsQ0FBQyxLQUFLLEVBQUU7WUFDbkUsT0FBUSxJQUFJLENBQUMsYUFBNkIsQ0FBQyxLQUE2QixDQUFDO1NBQzFFO1FBQ0QsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRUQ7Ozs7Ozs7OztPQVNHO0lBQ0gsSUFBSSxPQUFPO1FBQ1QsTUFBTSxNQUFNLEdBQTZCLEVBQUUsQ0FBQztRQUM1QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsYUFBeUMsQ0FBQztRQUUvRCw0RkFBNEY7UUFDNUYsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQXVDLENBQUM7UUFDbEUsTUFBTSxPQUFPLEdBQ1QsT0FBTyxTQUFTLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV4RixPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBYSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFFekQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxJQUFJLFVBQVU7UUFDWixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQztRQUM5QyxNQUFNLFFBQVEsR0FBZ0IsRUFBRSxDQUFDO1FBQ2pDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzFDLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QixRQUFRLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFDO1NBQ3ZDO1FBQ0QsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxRQUFRO1FBQ1YsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUN6QyxJQUFJLENBQUMsYUFBYTtZQUFFLE9BQU8sRUFBRSxDQUFDO1FBQzlCLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUM7UUFDMUMsTUFBTSxRQUFRLEdBQW1CLEVBQUUsQ0FBQztRQUNwQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMxQyxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUIsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFpQixDQUFDLENBQUM7U0FDdEQ7UUFDRCxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsU0FBa0M7UUFDdEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6QyxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDNUIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsUUFBUSxDQUFDLFNBQWtDO1FBQ3pDLE1BQU0sT0FBTyxHQUFtQixFQUFFLENBQUM7UUFDbkMsU0FBUyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzFDLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7T0FFRztJQUNILGFBQWEsQ0FBQyxTQUErQjtRQUMzQyxNQUFNLE9BQU8sR0FBZ0IsRUFBRSxDQUFDO1FBQ2hDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzQyxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7O09BV0c7SUFDSCxtQkFBbUIsQ0FBQyxTQUFpQixFQUFFLFFBQWM7UUFDbkQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQWlCLENBQUM7UUFDcEMsTUFBTSxnQkFBZ0IsR0FBZSxFQUFFLENBQUM7UUFFeEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDaEMsSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtnQkFDL0IsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQztnQkFDbkMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzlCLGdCQUFnQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNqQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsMkVBQTJFO1FBQzNFLG1FQUFtRTtRQUNuRSxJQUFJLE9BQU8sSUFBSSxDQUFDLGNBQWMsS0FBSyxVQUFVLEVBQUU7WUFDN0MseUZBQXlGO1lBQ3pGLDJGQUEyRjtZQUMzRixZQUFZO1lBQ1osSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFrQixFQUFFLEVBQUU7Z0JBQzVELDJGQUEyRjtnQkFDM0YsMkZBQTJGO2dCQUMzRix5RkFBeUY7Z0JBQ3pGLHdGQUF3RjtnQkFDeEYsNEZBQTRGO2dCQUM1RixxRkFBcUY7Z0JBQ3JGLElBQUksUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtvQkFDdEQsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQ25ELE9BQU8sZ0JBQWdCLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUNyRCxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2lCQUM1QztZQUNILENBQUMsQ0FBQyxDQUFDO1NBQ0o7SUFDSCxDQUFDO0NBQ0Y7QUFFRCxTQUFTLGlCQUFpQixDQUFDLE9BQXFCLEVBQUUsVUFBb0M7SUFDcEYsSUFBSSxPQUFPLEVBQUU7UUFDWCw2Q0FBNkM7UUFDN0MsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN6QyxNQUFNLGFBQWEsR0FBUSxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQzFDLE9BQU8sR0FBRyxLQUFLLElBQUksSUFBSSxHQUFHLEtBQUssYUFBYSxFQUFFO1lBQzVDLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxRCxLQUFLLElBQUksR0FBRyxJQUFJLFdBQVcsRUFBRTtnQkFDM0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNsRCx3REFBd0Q7b0JBQ3hELHdEQUF3RDtvQkFDeEQsd0RBQXdEO29CQUN4RCxNQUFNLEtBQUssR0FBSSxPQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3BDLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUU7d0JBQzNCLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7cUJBQ3pCO2lCQUNGO2FBQ0Y7WUFDRCxHQUFHLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNsQztLQUNGO0FBQ0gsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsS0FBVTtJQUNsQyxPQUFPLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUTtRQUN2RixLQUFLLEtBQUssSUFBSSxDQUFDO0FBQ3JCLENBQUM7QUFnQkQsU0FBUyxTQUFTLENBQ2QsYUFBMkIsRUFBRSxTQUF1RCxFQUNwRixPQUFtQyxFQUFFLFlBQXFCO0lBQzVELE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFFLENBQUM7SUFDdkQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDN0MsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO1FBQ2xCLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBVSxDQUFDO1FBQ2xFLGtCQUFrQixDQUNkLFdBQVcsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3JGO1NBQU07UUFDTCwrRkFBK0Y7UUFDL0YsUUFBUTtRQUNSLDJCQUEyQixDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztLQUN6RjtBQUNILENBQUM7QUFFRDs7Ozs7Ozs7O0dBU0c7QUFDSCxTQUFTLGtCQUFrQixDQUN2QixLQUFZLEVBQUUsS0FBWSxFQUFFLFNBQXVELEVBQ25GLE9BQW1DLEVBQUUsWUFBcUIsRUFBRSxjQUFtQjtJQUNqRixTQUFTLElBQUksbUJBQW1CLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQy9DLE1BQU0sVUFBVSxHQUFHLHNCQUFzQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN4RCxzREFBc0Q7SUFDdEQsSUFBSSxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsK0RBQStDLENBQUMsRUFBRTtRQUNsRSxrQ0FBa0M7UUFDbEMscUNBQXFDO1FBQ3JDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDN0UsSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDMUIsOEZBQThGO1lBQzlGLDJGQUEyRjtZQUMzRixNQUFNLGFBQWEsR0FBRyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ25FLElBQUksYUFBYSxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLEVBQUU7Z0JBQ3BELGtCQUFrQixDQUNkLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFXLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUNqRixjQUFjLENBQUMsQ0FBQzthQUNyQjtTQUNGO2FBQU07WUFDTCxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7Z0JBQ2YsZ0RBQWdEO2dCQUNoRCxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQzthQUMxRjtZQUVELHFGQUFxRjtZQUNyRiw2RkFBNkY7WUFDN0Ysd0ZBQXdGO1lBQ3hGLHNGQUFzRjtZQUN0RixzRkFBc0Y7WUFDdEYseUVBQXlFO1lBQ3pFLDRFQUE0RTtZQUM1RSxVQUFVLElBQUksMkJBQTJCLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7U0FDekY7UUFDRCwyRkFBMkY7UUFDM0YsYUFBYTtRQUNiLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0MsSUFBSSxZQUFZLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDakMsNkJBQTZCLENBQ3pCLGVBQWUsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztTQUN4RTtLQUNGO1NBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSw4QkFBc0IsRUFBRTtRQUMzQyxtQ0FBbUM7UUFDbkMscUNBQXFDO1FBQ3JDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNyRixzREFBc0Q7UUFDdEQsNkJBQTZCLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0tBQzdGO1NBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxnQ0FBdUIsRUFBRTtRQUM1QywyRUFBMkU7UUFDM0UsaUVBQWlFO1FBQ2pFLE1BQU0sYUFBYSxHQUFHLEtBQU0sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQWlCLENBQUM7UUFDNUQsTUFBTSxJQUFJLEdBQ0wsYUFBYSxDQUFDLFVBQStCLENBQUMsS0FBSyxDQUFDLFVBQW9CLENBQUMsQ0FBQztRQUUvRSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdkIsS0FBSyxJQUFJLFVBQVUsSUFBSSxJQUFJLEVBQUU7Z0JBQzNCLGNBQWMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7YUFDOUU7U0FDRjthQUFNLElBQUksSUFBSSxFQUFFO1lBQ2YsTUFBTSxTQUFTLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBVyxDQUFDO1lBQ2xELE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBVSxDQUFDO1lBQzdELGtCQUFrQixDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7U0FDNUY7S0FDRjtTQUFNLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRTtRQUN0QiwrQkFBK0I7UUFDL0Isa0JBQWtCLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7S0FDMUY7SUFFRCw0REFBNEQ7SUFDNUQsSUFBSSxjQUFjLEtBQUssVUFBVSxFQUFFO1FBQ2pDLDRGQUE0RjtRQUM1RixrRUFBa0U7UUFDbEUsTUFBTSxTQUFTLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxpQ0FBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBQzdGLElBQUksU0FBUyxFQUFFO1lBQ2Isa0JBQWtCLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztTQUN4RjtLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsU0FBUyw2QkFBNkIsQ0FDbEMsVUFBc0IsRUFBRSxTQUF1RCxFQUMvRSxPQUFtQyxFQUFFLFlBQXFCLEVBQUUsY0FBbUI7SUFDakYsS0FBSyxJQUFJLENBQUMsR0FBRyx1QkFBdUIsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNoRSxNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFVLENBQUM7UUFDekMsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsQ0FBQztRQUMvQyxJQUFJLFVBQVUsRUFBRTtZQUNkLGtCQUFrQixDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7U0FDN0Y7S0FDRjtBQUNILENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILFNBQVMsY0FBYyxDQUNuQixVQUFlLEVBQUUsU0FBdUQsRUFDeEUsT0FBbUMsRUFBRSxZQUFxQixFQUFFLGNBQW1CO0lBQ2pGLElBQUksY0FBYyxLQUFLLFVBQVUsRUFBRTtRQUNqQyxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNkLE9BQU87U0FDUjtRQUNELDJFQUEyRTtRQUMzRSwrRUFBK0U7UUFDL0UsdUVBQXVFO1FBQ3ZFLElBQUksWUFBWSxJQUFJLENBQUMsU0FBUyxZQUFZLFlBQVksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxTQUFTLENBQUM7WUFDM0UsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtZQUNyQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ3pCO2FBQU0sSUFDSCxDQUFDLFlBQVksSUFBSyxTQUFrQyxDQUFDLFNBQVMsQ0FBQztZQUM5RCxPQUF1QixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtZQUNyRCxPQUF1QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUMxQztLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxTQUFTLDJCQUEyQixDQUNoQyxVQUFlLEVBQUUsU0FBdUQsRUFDeEUsT0FBbUMsRUFBRSxZQUFxQjtJQUM1RCxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDO0lBQ3BDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFFNUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMvQixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXJDLElBQUksU0FBUyxFQUFFO1lBQ2IsSUFBSSxZQUFZLElBQUksQ0FBQyxTQUFTLFlBQVksWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDLFNBQVMsQ0FBQztnQkFDM0UsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUN6QjtpQkFBTSxJQUNILENBQUMsWUFBWSxJQUFLLFNBQWtDLENBQUMsU0FBUyxDQUFDO2dCQUM5RCxPQUF1QixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDckQsT0FBdUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDMUM7WUFFRCwyQkFBMkIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztTQUNyRTtLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLHVCQUF1QixDQUM1QixVQUFtQyxFQUFFLEtBQVksRUFBRSxLQUFZLEVBQUUsS0FBWTtJQUMvRSxJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUM7SUFFNUMsSUFBSSxjQUFjLEtBQUssSUFBSSxFQUFFO1FBQzNCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzlDLE1BQU0sWUFBWSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFXLENBQUM7WUFDbkQsTUFBTSxhQUFhLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUM1QixJQUFJLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDakQsS0FBSyxJQUFJLGVBQWUsQ0FBQyxLQUFLLENBQUMsWUFBWSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7aUJBQzlFO2dCQUNELFVBQVUsQ0FBQyxZQUFZLENBQUMsR0FBRyxLQUFLLENBQUM7YUFDbEM7aUJBQU07Z0JBQ0wsVUFBVSxDQUFDLFlBQVksQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQzthQUNoRDtTQUNGO0tBQ0Y7QUFDSCxDQUFDO0FBR0Qsc0ZBQXNGO0FBQ3RGLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7QUFFekQsTUFBTSxpQkFBaUIsR0FBRyxjQUFjLENBQUM7QUFFekM7O0dBRUc7QUFDSCxNQUFNLFVBQVUsWUFBWSxDQUFDLFVBQWU7SUFDMUMsSUFBSSxVQUFVLFlBQVksSUFBSSxFQUFFO1FBQzlCLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxFQUFFO1lBQ2xELFVBQWtCLENBQUMsaUJBQWlCLENBQUMsR0FBRyxVQUFVLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDL0UsSUFBSSxZQUFZLENBQUMsVUFBcUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pDLElBQUksU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQy9CO1FBQ0QsT0FBUSxVQUFrQixDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDL0M7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCwrREFBK0Q7QUFDL0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxXQUFnQjtJQUM3QyxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLFVBQVUsZ0JBQWdCO0lBQzlCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQ3JELENBQUM7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLElBQWU7SUFDNUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDcEQsQ0FBQztBQUVELE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxJQUFlO0lBQ3RELHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDakQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge2Fzc2VydFROb2RlRm9yTFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvYXNzZXJ0JztcbmltcG9ydCB7Z2V0TENvbnRleHR9IGZyb20gJy4uL3JlbmRlcjMvY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTkFUSVZFfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzQ29tcG9uZW50SG9zdCwgaXNMQ29udGFpbmVyfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtERUNMQVJBVElPTl9DT01QT05FTlRfVklFVywgTFZpZXcsIFBBUkVOVCwgVF9IT1NULCBURGF0YSwgVFZJRVd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50LCBnZXRDb250ZXh0LCBnZXRJbmplY3Rpb25Ub2tlbnMsIGdldEluamVjdG9yLCBnZXRMaXN0ZW5lcnMsIGdldExvY2FsUmVmcywgZ2V0T3duaW5nQ29tcG9uZW50fSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvZGlzY292ZXJ5X3V0aWxzJztcbmltcG9ydCB7SU5URVJQT0xBVElPTl9ERUxJTUlURVJ9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvc3RyaW5naWZ5X3V0aWxzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50TFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlT3JOdWxsfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2Fzc2VydERvbU5vZGV9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWJ1Z0V2ZW50TGlzdGVuZXIge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwdWJsaWMgY2FsbGJhY2s6IEZ1bmN0aW9uKSB7fVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzTmF0aXZlRWxlbWVudHMoZGVidWdFbHM6IERlYnVnRWxlbWVudFtdKTogYW55IHtcbiAgcmV0dXJuIGRlYnVnRWxzLm1hcCgoZWwpID0+IGVsLm5hdGl2ZUVsZW1lbnQpO1xufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIERlYnVnTm9kZSB7XG4gIC8qKlxuICAgKiBUaGUgdW5kZXJseWluZyBET00gbm9kZS5cbiAgICovXG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IGFueTtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBOb2RlKSB7XG4gICAgdGhpcy5uYXRpdmVOb2RlID0gbmF0aXZlTm9kZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgYERlYnVnRWxlbWVudGAgcGFyZW50LiBXaWxsIGJlIGBudWxsYCBpZiB0aGlzIGlzIHRoZSByb290IGVsZW1lbnQuXG4gICAqL1xuICBnZXQgcGFyZW50KCk6IERlYnVnRWxlbWVudHxudWxsIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLm5hdGl2ZU5vZGUucGFyZW50Tm9kZSBhcyBFbGVtZW50O1xuICAgIHJldHVybiBwYXJlbnQgPyBuZXcgRGVidWdFbGVtZW50KHBhcmVudCkgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBob3N0IGRlcGVuZGVuY3kgaW5qZWN0b3IuIEZvciBleGFtcGxlLCB0aGUgcm9vdCBlbGVtZW50J3MgY29tcG9uZW50IGluc3RhbmNlIGluamVjdG9yLlxuICAgKi9cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICByZXR1cm4gZ2V0SW5qZWN0b3IodGhpcy5uYXRpdmVOb2RlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgZWxlbWVudCdzIG93biBjb21wb25lbnQgaW5zdGFuY2UsIGlmIGl0IGhhcyBvbmUuXG4gICAqL1xuICBnZXQgY29tcG9uZW50SW5zdGFuY2UoKTogYW55IHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gdGhpcy5uYXRpdmVOb2RlO1xuICAgIHJldHVybiBuYXRpdmVFbGVtZW50ICYmXG4gICAgICAgIChnZXRDb21wb25lbnQobmF0aXZlRWxlbWVudCBhcyBFbGVtZW50KSB8fCBnZXRPd25pbmdDb21wb25lbnQobmF0aXZlRWxlbWVudCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIG9iamVjdCB0aGF0IHByb3ZpZGVzIHBhcmVudCBjb250ZXh0IGZvciB0aGlzIGVsZW1lbnQuIE9mdGVuIGFuIGFuY2VzdG9yIGNvbXBvbmVudCBpbnN0YW5jZVxuICAgKiB0aGF0IGdvdmVybnMgdGhpcyBlbGVtZW50LlxuICAgKlxuICAgKiBXaGVuIGFuIGVsZW1lbnQgaXMgcmVwZWF0ZWQgd2l0aGluICpuZ0ZvciwgdGhlIGNvbnRleHQgaXMgYW4gYE5nRm9yT2ZgIHdob3NlIGAkaW1wbGljaXRgXG4gICAqIHByb3BlcnR5IGlzIHRoZSB2YWx1ZSBvZiB0aGUgcm93IGluc3RhbmNlIHZhbHVlLiBGb3IgZXhhbXBsZSwgdGhlIGBoZXJvYCBpbiBgKm5nRm9yPVwibGV0IGhlcm9cbiAgICogb2YgaGVyb2VzXCJgLlxuICAgKi9cbiAgZ2V0IGNvbnRleHQoKTogYW55IHtcbiAgICByZXR1cm4gZ2V0Q29tcG9uZW50KHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KSB8fCBnZXRDb250ZXh0KHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgY2FsbGJhY2tzIGF0dGFjaGVkIHRvIHRoZSBjb21wb25lbnQncyBAT3V0cHV0IHByb3BlcnRpZXMgYW5kL29yIHRoZSBlbGVtZW50J3MgZXZlbnRcbiAgICogcHJvcGVydGllcy5cbiAgICovXG4gIGdldCBsaXN0ZW5lcnMoKTogRGVidWdFdmVudExpc3RlbmVyW10ge1xuICAgIHJldHVybiBnZXRMaXN0ZW5lcnModGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQpLmZpbHRlcihsaXN0ZW5lciA9PiBsaXN0ZW5lci50eXBlID09PSAnZG9tJyk7XG4gIH1cblxuICAvKipcbiAgICogRGljdGlvbmFyeSBvZiBvYmplY3RzIGFzc29jaWF0ZWQgd2l0aCB0ZW1wbGF0ZSBsb2NhbCB2YXJpYWJsZXMgKGUuZy4gI2ZvbyksIGtleWVkIGJ5IHRoZSBsb2NhbFxuICAgKiB2YXJpYWJsZSBuYW1lLlxuICAgKi9cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIHJldHVybiBnZXRMb2NhbFJlZnModGhpcy5uYXRpdmVOb2RlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGNvbXBvbmVudCdzIGluamVjdG9yIGxvb2t1cCB0b2tlbnMuIEluY2x1ZGVzIHRoZSBjb21wb25lbnQgaXRzZWxmIHBsdXMgdGhlIHRva2VucyB0aGF0IHRoZVxuICAgKiBjb21wb25lbnQgbGlzdHMgaW4gaXRzIHByb3ZpZGVycyBtZXRhZGF0YS5cbiAgICovXG4gIGdldCBwcm92aWRlclRva2VucygpOiBhbnlbXSB7XG4gICAgcmV0dXJuIGdldEluamVjdGlvblRva2Vucyh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKlxuICogQHNlZSBbQ29tcG9uZW50IHRlc3Rpbmcgc2NlbmFyaW9zXShndWlkZS90ZXN0aW5nLWNvbXBvbmVudHMtc2NlbmFyaW9zKVxuICogQHNlZSBbQmFzaWNzIG9mIHRlc3RpbmcgY29tcG9uZW50c10oZ3VpZGUvdGVzdGluZy1jb21wb25lbnRzLWJhc2ljcylcbiAqIEBzZWUgW1Rlc3RpbmcgdXRpbGl0eSBBUElzXShndWlkZS90ZXN0aW5nLXV0aWxpdHktYXBpcylcbiAqL1xuZXhwb3J0IGNsYXNzIERlYnVnRWxlbWVudCBleHRlbmRzIERlYnVnTm9kZSB7XG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IEVsZW1lbnQpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShuYXRpdmVOb2RlKTtcbiAgICBzdXBlcihuYXRpdmVOb2RlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgdW5kZXJseWluZyBET00gZWxlbWVudCBhdCB0aGUgcm9vdCBvZiB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgZ2V0IG5hdGl2ZUVsZW1lbnQoKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5uYXRpdmVOb2RlLm5vZGVUeXBlID09IE5vZGUuRUxFTUVOVF9OT0RFID8gdGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBlbGVtZW50IHRhZyBuYW1lLCBpZiBpdCBpcyBhbiBlbGVtZW50LlxuICAgKi9cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICBjb25zdCBjb250ZXh0ID0gZ2V0TENvbnRleHQodGhpcy5uYXRpdmVOb2RlKSE7XG4gICAgY29uc3QgbFZpZXcgPSBjb250ZXh0ID8gY29udGV4dC5sVmlldyA6IG51bGw7XG5cbiAgICBpZiAobFZpZXcgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgICBjb25zdCB0Tm9kZSA9IHREYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgICAgIHJldHVybiB0Tm9kZS52YWx1ZSE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLm5hdGl2ZU5vZGUubm9kZU5hbWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqICBHZXRzIGEgbWFwIG9mIHByb3BlcnR5IG5hbWVzIHRvIHByb3BlcnR5IHZhbHVlcyBmb3IgYW4gZWxlbWVudC5cbiAgICpcbiAgICogIFRoaXMgbWFwIGluY2x1ZGVzOlxuICAgKiAgLSBSZWd1bGFyIHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBbaWRdPVwiaWRcImApXG4gICAqICAtIEhvc3QgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYGhvc3Q6IHsgJ1tpZF0nOiBcImlkXCIgfWApXG4gICAqICAtIEludGVycG9sYXRlZCBwcm9wZXJ0eSBiaW5kaW5ncyAoZS5nLiBgaWQ9XCJ7eyB2YWx1ZSB9fVwiKVxuICAgKlxuICAgKiAgSXQgZG9lcyBub3QgaW5jbHVkZTpcbiAgICogIC0gaW5wdXQgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYFtteUN1c3RvbUlucHV0XT1cInZhbHVlXCJgKVxuICAgKiAgLSBhdHRyaWJ1dGUgYmluZGluZ3MgKGUuZy4gYFthdHRyLnJvbGVdPVwibWVudVwiYClcbiAgICovXG4gIGdldCBwcm9wZXJ0aWVzKCk6IHtba2V5OiBzdHJpbmddOiBhbnk7fSB7XG4gICAgY29uc3QgY29udGV4dCA9IGdldExDb250ZXh0KHRoaXMubmF0aXZlTm9kZSkhO1xuICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dCA/IGNvbnRleHQubFZpZXcgOiBudWxsO1xuXG4gICAgaWYgKGxWaWV3ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgICBjb25zdCB0Tm9kZSA9IHREYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZTtcblxuICAgIGNvbnN0IHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG4gICAgLy8gQ29sbGVjdCBwcm9wZXJ0aWVzIGZyb20gdGhlIERPTS5cbiAgICBjb3B5RG9tUHJvcGVydGllcyh0aGlzLm5hdGl2ZUVsZW1lbnQsIHByb3BlcnRpZXMpO1xuICAgIC8vIENvbGxlY3QgcHJvcGVydGllcyBmcm9tIHRoZSBiaW5kaW5ncy4gVGhpcyBpcyBuZWVkZWQgZm9yIGFuaW1hdGlvbiByZW5kZXJlciB3aGljaCBoYXNcbiAgICAvLyBzeW50aGV0aWMgcHJvcGVydGllcyB3aGljaCBkb24ndCBnZXQgcmVmbGVjdGVkIGludG8gdGhlIERPTS5cbiAgICBjb2xsZWN0UHJvcGVydHlCaW5kaW5ncyhwcm9wZXJ0aWVzLCB0Tm9kZSwgbFZpZXcsIHREYXRhKTtcbiAgICByZXR1cm4gcHJvcGVydGllcztcbiAgfVxuXG4gIC8qKlxuICAgKiAgQSBtYXAgb2YgYXR0cmlidXRlIG5hbWVzIHRvIGF0dHJpYnV0ZSB2YWx1ZXMgZm9yIGFuIGVsZW1lbnQuXG4gICAqL1xuICBnZXQgYXR0cmlidXRlcygpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfG51bGx9IHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfG51bGx9ID0ge307XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcblxuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGV4dCA9IGdldExDb250ZXh0KGVsZW1lbnQpITtcbiAgICBjb25zdCBsVmlldyA9IGNvbnRleHQgPyBjb250ZXh0LmxWaWV3IDogbnVsbDtcblxuICAgIGlmIChsVmlldyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIGNvbnN0IHROb2RlQXR0cnMgPSAobFZpZXdbVFZJRVddLmRhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlKS5hdHRycztcbiAgICBjb25zdCBsb3dlcmNhc2VUTm9kZUF0dHJzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgLy8gRm9yIGRlYnVnIG5vZGVzIHdlIHRha2UgdGhlIGVsZW1lbnQncyBhdHRyaWJ1dGUgZGlyZWN0bHkgZnJvbSB0aGUgRE9NIHNpbmNlIGl0IGFsbG93cyB1c1xuICAgIC8vIHRvIGFjY291bnQgZm9yIG9uZXMgdGhhdCB3ZXJlbid0IHNldCB2aWEgYmluZGluZ3MgKGUuZy4gVmlld0VuZ2luZSBrZWVwcyB0cmFjayBvZiB0aGUgb25lc1xuICAgIC8vIHRoYXQgYXJlIHNldCB0aHJvdWdoIGBSZW5kZXJlcjJgKS4gVGhlIHByb2JsZW0gaXMgdGhhdCB0aGUgYnJvd3NlciB3aWxsIGxvd2VyY2FzZSBhbGwgbmFtZXMsXG4gICAgLy8gaG93ZXZlciBzaW5jZSB3ZSBoYXZlIHRoZSBhdHRyaWJ1dGVzIGFscmVhZHkgb24gdGhlIFROb2RlLCB3ZSBjYW4gcHJlc2VydmUgdGhlIGNhc2UgYnkgZ29pbmdcbiAgICAvLyB0aHJvdWdoIHRoZW0gb25jZSwgYWRkaW5nIHRoZW0gdG8gdGhlIGBhdHRyaWJ1dGVzYCBtYXAgYW5kIHB1dHRpbmcgdGhlaXIgbG93ZXItY2FzZWQgbmFtZVxuICAgIC8vIGludG8gYW4gYXJyYXkuIEFmdGVyd2FyZHMgd2hlbiB3ZSdyZSBnb2luZyB0aHJvdWdoIHRoZSBuYXRpdmUgRE9NIGF0dHJpYnV0ZXMsIHdlIGNhbiBjaGVja1xuICAgIC8vIHdoZXRoZXIgd2UgaGF2ZW4ndCBydW4gaW50byBhbiBhdHRyaWJ1dGUgYWxyZWFkeSB0aHJvdWdoIHRoZSBUTm9kZS5cbiAgICBpZiAodE5vZGVBdHRycykge1xuICAgICAgbGV0IGkgPSAwO1xuICAgICAgd2hpbGUgKGkgPCB0Tm9kZUF0dHJzLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBhdHRyTmFtZSA9IHROb2RlQXR0cnNbaV07XG5cbiAgICAgICAgLy8gU3RvcCBhcyBzb29uIGFzIHdlIGhpdCBhIG1hcmtlci4gV2Ugb25seSBjYXJlIGFib3V0IHRoZSByZWd1bGFyIGF0dHJpYnV0ZXMuIEV2ZXJ5dGhpbmdcbiAgICAgICAgLy8gZWxzZSB3aWxsIGJlIGhhbmRsZWQgYmVsb3cgd2hlbiB3ZSByZWFkIHRoZSBmaW5hbCBhdHRyaWJ1dGVzIG9mZiB0aGUgRE9NLlxuICAgICAgICBpZiAodHlwZW9mIGF0dHJOYW1lICE9PSAnc3RyaW5nJykgYnJlYWs7XG5cbiAgICAgICAgY29uc3QgYXR0clZhbHVlID0gdE5vZGVBdHRyc1tpICsgMV07XG4gICAgICAgIGF0dHJpYnV0ZXNbYXR0ck5hbWVdID0gYXR0clZhbHVlIGFzIHN0cmluZztcbiAgICAgICAgbG93ZXJjYXNlVE5vZGVBdHRycy5wdXNoKGF0dHJOYW1lLnRvTG93ZXJDYXNlKCkpO1xuXG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBlQXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGF0dHIgPSBlQXR0cnNbaV07XG4gICAgICBjb25zdCBsb3dlcmNhc2VOYW1lID0gYXR0ci5uYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHdlIGRvbid0IGFzc2lnbiB0aGUgc2FtZSBhdHRyaWJ1dGUgYm90aCBpbiBpdHNcbiAgICAgIC8vIGNhc2Utc2Vuc2l0aXZlIGZvcm0gYW5kIHRoZSBsb3dlci1jYXNlZCBvbmUgZnJvbSB0aGUgYnJvd3Nlci5cbiAgICAgIGlmIChsb3dlcmNhc2VUTm9kZUF0dHJzLmluZGV4T2YobG93ZXJjYXNlTmFtZSkgPT09IC0xKSB7XG4gICAgICAgIC8vIFNhdmUgdGhlIGxvd2VyY2FzZSBuYW1lIHRvIGFsaWduIHRoZSBiZWhhdmlvciBiZXR3ZWVuIGJyb3dzZXJzLlxuICAgICAgICAvLyBJRSBwcmVzZXJ2ZXMgdGhlIGNhc2UsIHdoaWxlIGFsbCBvdGhlciBicm93c2VyIGNvbnZlcnQgaXQgdG8gbG93ZXIgY2FzZS5cbiAgICAgICAgYXR0cmlidXRlc1tsb3dlcmNhc2VOYW1lXSA9IGF0dHIudmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGlubGluZSBzdHlsZXMgb2YgdGhlIERPTSBlbGVtZW50LlxuICAgKlxuICAgKiBXaWxsIGJlIGBudWxsYCBpZiB0aGVyZSBpcyBubyBgc3R5bGVgIHByb3BlcnR5IG9uIHRoZSB1bmRlcmx5aW5nIERPTSBlbGVtZW50LlxuICAgKlxuICAgKiBAc2VlIFtFbGVtZW50Q1NTSW5saW5lU3R5bGVdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50Q1NTSW5saW5lU3R5bGUvc3R5bGUpXG4gICAqL1xuICBnZXQgc3R5bGVzKCk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd8bnVsbH0ge1xuICAgIGlmICh0aGlzLm5hdGl2ZUVsZW1lbnQgJiYgKHRoaXMubmF0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudCkuc3R5bGUpIHtcbiAgICAgIHJldHVybiAodGhpcy5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50KS5zdHlsZSBhcyB7W2tleTogc3RyaW5nXTogYW55fTtcbiAgICB9XG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgLyoqXG4gICAqIEEgbWFwIGNvbnRhaW5pbmcgdGhlIGNsYXNzIG5hbWVzIG9uIHRoZSBlbGVtZW50IGFzIGtleXMuXG4gICAqXG4gICAqIFRoaXMgbWFwIGlzIGRlcml2ZWQgZnJvbSB0aGUgYGNsYXNzTmFtZWAgcHJvcGVydHkgb2YgdGhlIERPTSBlbGVtZW50LlxuICAgKlxuICAgKiBOb3RlOiBUaGUgdmFsdWVzIG9mIHRoaXMgb2JqZWN0IHdpbGwgYWx3YXlzIGJlIGB0cnVlYC4gVGhlIGNsYXNzIGtleSB3aWxsIG5vdCBhcHBlYXIgaW4gdGhlIEtWXG4gICAqIG9iamVjdCBpZiBpdCBkb2VzIG5vdCBleGlzdCBvbiB0aGUgZWxlbWVudC5cbiAgICpcbiAgICogQHNlZSBbRWxlbWVudC5jbGFzc05hbWVdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50L2NsYXNzTmFtZSlcbiAgICovXG4gIGdldCBjbGFzc2VzKCk6IHtba2V5OiBzdHJpbmddOiBib29sZWFufSB7XG4gICAgY29uc3QgcmVzdWx0OiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn0gPSB7fTtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudDtcblxuICAgIC8vIFNWRyBlbGVtZW50cyByZXR1cm4gYW4gYFNWR0FuaW1hdGVkU3RyaW5nYCBpbnN0ZWFkIG9mIGEgcGxhaW4gc3RyaW5nIGZvciB0aGUgYGNsYXNzTmFtZWAuXG4gICAgY29uc3QgY2xhc3NOYW1lID0gZWxlbWVudC5jbGFzc05hbWUgYXMgc3RyaW5nIHwgU1ZHQW5pbWF0ZWRTdHJpbmc7XG4gICAgY29uc3QgY2xhc3NlcyA9XG4gICAgICAgIHR5cGVvZiBjbGFzc05hbWUgIT09ICdzdHJpbmcnID8gY2xhc3NOYW1lLmJhc2VWYWwuc3BsaXQoJyAnKSA6IGNsYXNzTmFtZS5zcGxpdCgnICcpO1xuXG4gICAgY2xhc3Nlcy5mb3JFYWNoKCh2YWx1ZTogc3RyaW5nKSA9PiByZXN1bHRbdmFsdWVdID0gdHJ1ZSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBgY2hpbGROb2Rlc2Agb2YgdGhlIERPTSBlbGVtZW50IGFzIGEgYERlYnVnTm9kZWAgYXJyYXkuXG4gICAqXG4gICAqIEBzZWUgW05vZGUuY2hpbGROb2Rlc10oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL05vZGUvY2hpbGROb2RlcylcbiAgICovXG4gIGdldCBjaGlsZE5vZGVzKCk6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBjaGlsZE5vZGVzID0gdGhpcy5uYXRpdmVOb2RlLmNoaWxkTm9kZXM7XG4gICAgY29uc3QgY2hpbGRyZW46IERlYnVnTm9kZVtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgIGNoaWxkcmVuLnB1c2goZ2V0RGVidWdOb2RlKGVsZW1lbnQpISk7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgaW1tZWRpYXRlIGBEZWJ1Z0VsZW1lbnRgIGNoaWxkcmVuLiBXYWxrIHRoZSB0cmVlIGJ5IGRlc2NlbmRpbmcgdGhyb3VnaCBgY2hpbGRyZW5gLlxuICAgKi9cbiAgZ2V0IGNoaWxkcmVuKCk6IERlYnVnRWxlbWVudFtdIHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gdGhpcy5uYXRpdmVFbGVtZW50O1xuICAgIGlmICghbmF0aXZlRWxlbWVudCkgcmV0dXJuIFtdO1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSBuYXRpdmVFbGVtZW50LmNoaWxkcmVuO1xuICAgIGNvbnN0IGNoaWxkcmVuOiBEZWJ1Z0VsZW1lbnRbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGNoaWxkTm9kZXNbaV07XG4gICAgICBjaGlsZHJlbi5wdXNoKGdldERlYnVnTm9kZShlbGVtZW50KSBhcyBEZWJ1Z0VsZW1lbnQpO1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgdGhlIGZpcnN0IGBEZWJ1Z0VsZW1lbnRgIHRoYXQgbWF0Y2hlcyB0aGUgcHJlZGljYXRlIGF0IGFueSBkZXB0aCBpbiB0aGUgc3VidHJlZS5cbiAgICovXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQge1xuICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnF1ZXJ5QWxsKHByZWRpY2F0ZSk7XG4gICAgcmV0dXJuIHJlc3VsdHNbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBBbGwgYERlYnVnRWxlbWVudGAgbWF0Y2hlcyBmb3IgdGhlIHByZWRpY2F0ZSBhdCBhbnkgZGVwdGggaW4gdGhlIHN1YnRyZWUuXG4gICAqL1xuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgX3F1ZXJ5QWxsKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcywgdHJ1ZSk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgQWxsIGBEZWJ1Z05vZGVgIG1hdGNoZXMgZm9yIHRoZSBwcmVkaWNhdGUgYXQgYW55IGRlcHRoIGluIHRoZSBzdWJ0cmVlLlxuICAgKi9cbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgX3F1ZXJ5QWxsKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZmFsc2UpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXJzIHRoZSBldmVudCBieSBpdHMgbmFtZSBpZiB0aGVyZSBpcyBhIGNvcnJlc3BvbmRpbmcgbGlzdGVuZXIgaW4gdGhlIGVsZW1lbnQnc1xuICAgKiBgbGlzdGVuZXJzYCBjb2xsZWN0aW9uLlxuICAgKlxuICAgKiBJZiB0aGUgZXZlbnQgbGFja3MgYSBsaXN0ZW5lciBvciB0aGVyZSdzIHNvbWUgb3RoZXIgcHJvYmxlbSwgY29uc2lkZXJcbiAgICogY2FsbGluZyBgbmF0aXZlRWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50T2JqZWN0KWAuXG4gICAqXG4gICAqIEBwYXJhbSBldmVudE5hbWUgVGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIHRyaWdnZXJcbiAgICogQHBhcmFtIGV2ZW50T2JqIFRoZSBfZXZlbnQgb2JqZWN0XyBleHBlY3RlZCBieSB0aGUgaGFuZGxlclxuICAgKlxuICAgKiBAc2VlIFtUZXN0aW5nIGNvbXBvbmVudHMgc2NlbmFyaW9zXShndWlkZS90ZXN0aW5nLWNvbXBvbmVudHMtc2NlbmFyaW9zI3RyaWdnZXItZXZlbnQtaGFuZGxlcilcbiAgICovXG4gIHRyaWdnZXJFdmVudEhhbmRsZXIoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50T2JqPzogYW55KTogdm9pZCB7XG4gICAgY29uc3Qgbm9kZSA9IHRoaXMubmF0aXZlTm9kZSBhcyBhbnk7XG4gICAgY29uc3QgaW52b2tlZExpc3RlbmVyczogRnVuY3Rpb25bXSA9IFtdO1xuXG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiB7XG4gICAgICBpZiAobGlzdGVuZXIubmFtZSA9PT0gZXZlbnROYW1lKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrID0gbGlzdGVuZXIuY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrLmNhbGwobm9kZSwgZXZlbnRPYmopO1xuICAgICAgICBpbnZva2VkTGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gV2UgbmVlZCB0byBjaGVjayB3aGV0aGVyIGBldmVudExpc3RlbmVyc2AgZXhpc3RzLCBiZWNhdXNlIGl0J3Mgc29tZXRoaW5nXG4gICAgLy8gdGhhdCBab25lLmpzIG9ubHkgYWRkcyB0byBgRXZlbnRUYXJnZXRgIGluIGJyb3dzZXIgZW52aXJvbm1lbnRzLlxuICAgIGlmICh0eXBlb2Ygbm9kZS5ldmVudExpc3RlbmVycyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gTm90ZSB0aGF0IGluIEl2eSB3ZSB3cmFwIGV2ZW50IGxpc3RlbmVycyB3aXRoIGEgY2FsbCB0byBgZXZlbnQucHJldmVudERlZmF1bHRgIGluIHNvbWVcbiAgICAgIC8vIGNhc2VzLiBXZSB1c2UgJ19fbmdVbndyYXBfXycgYXMgYSBzcGVjaWFsIHRva2VuIHRoYXQgZ2l2ZXMgdXMgYWNjZXNzIHRvIHRoZSBhY3R1YWwgZXZlbnRcbiAgICAgIC8vIGxpc3RlbmVyLlxuICAgICAgbm9kZS5ldmVudExpc3RlbmVycyhldmVudE5hbWUpLmZvckVhY2goKGxpc3RlbmVyOiBGdW5jdGlvbikgPT4ge1xuICAgICAgICAvLyBJbiBvcmRlciB0byBlbnN1cmUgdGhhdCB3ZSBjYW4gZGV0ZWN0IHRoZSBzcGVjaWFsIF9fbmdVbndyYXBfXyB0b2tlbiBkZXNjcmliZWQgYWJvdmUsIHdlXG4gICAgICAgIC8vIHVzZSBgdG9TdHJpbmdgIG9uIHRoZSBsaXN0ZW5lciBhbmQgc2VlIGlmIGl0IGNvbnRhaW5zIHRoZSB0b2tlbi4gV2UgdXNlIHRoaXMgYXBwcm9hY2ggdG9cbiAgICAgICAgLy8gZW5zdXJlIHRoYXQgaXQgc3RpbGwgd29ya2VkIHdpdGggY29tcGlsZWQgY29kZSBzaW5jZSBpdCBjYW5ub3QgcmVtb3ZlIG9yIHJlbmFtZSBzdHJpbmdcbiAgICAgICAgLy8gbGl0ZXJhbHMuIFdlIGFsc28gY29uc2lkZXJlZCB1c2luZyBhIHNwZWNpYWwgZnVuY3Rpb24gbmFtZSAoaS5lLiBpZihsaXN0ZW5lci5uYW1lID09PVxuICAgICAgICAvLyBzcGVjaWFsKSkgYnV0IHRoYXQgd2FzIG1vcmUgY3VtYmVyc29tZSBhbmQgd2Ugd2VyZSBhbHNvIGNvbmNlcm5lZCB0aGUgY29tcGlsZWQgY29kZSBjb3VsZFxuICAgICAgICAvLyBzdHJpcCB0aGUgbmFtZSwgdHVybmluZyB0aGUgY29uZGl0aW9uIGluIHRvIChcIlwiID09PSBcIlwiKSBhbmQgYWx3YXlzIHJldHVybmluZyB0cnVlLlxuICAgICAgICBpZiAobGlzdGVuZXIudG9TdHJpbmcoKS5pbmRleE9mKCdfX25nVW53cmFwX18nKSAhPT0gLTEpIHtcbiAgICAgICAgICBjb25zdCB1bndyYXBwZWRMaXN0ZW5lciA9IGxpc3RlbmVyKCdfX25nVW53cmFwX18nKTtcbiAgICAgICAgICByZXR1cm4gaW52b2tlZExpc3RlbmVycy5pbmRleE9mKHVud3JhcHBlZExpc3RlbmVyKSA9PT0gLTEgJiZcbiAgICAgICAgICAgICAgdW53cmFwcGVkTGlzdGVuZXIuY2FsbChub2RlLCBldmVudE9iaik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjb3B5RG9tUHJvcGVydGllcyhlbGVtZW50OiBFbGVtZW50fG51bGwsIHByb3BlcnRpZXM6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSk6IHZvaWQge1xuICBpZiAoZWxlbWVudCkge1xuICAgIC8vIFNraXAgb3duIHByb3BlcnRpZXMgKGFzIHRob3NlIGFyZSBwYXRjaGVkKVxuICAgIGxldCBvYmogPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZWxlbWVudCk7XG4gICAgY29uc3QgTm9kZVByb3RvdHlwZTogYW55ID0gTm9kZS5wcm90b3R5cGU7XG4gICAgd2hpbGUgKG9iaiAhPT0gbnVsbCAmJiBvYmogIT09IE5vZGVQcm90b3R5cGUpIHtcbiAgICAgIGNvbnN0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMob2JqKTtcbiAgICAgIGZvciAobGV0IGtleSBpbiBkZXNjcmlwdG9ycykge1xuICAgICAgICBpZiAoIWtleS5zdGFydHNXaXRoKCdfXycpICYmICFrZXkuc3RhcnRzV2l0aCgnb24nKSkge1xuICAgICAgICAgIC8vIGRvbid0IGluY2x1ZGUgcHJvcGVydGllcyBzdGFydGluZyB3aXRoIGBfX2AgYW5kIGBvbmAuXG4gICAgICAgICAgLy8gYF9fYCBhcmUgcGF0Y2hlZCB2YWx1ZXMgd2hpY2ggc2hvdWxkIG5vdCBiZSBpbmNsdWRlZC5cbiAgICAgICAgICAvLyBgb25gIGFyZSBsaXN0ZW5lcnMgd2hpY2ggYWxzbyBzaG91bGQgbm90IGJlIGluY2x1ZGVkLlxuICAgICAgICAgIGNvbnN0IHZhbHVlID0gKGVsZW1lbnQgYXMgYW55KVtrZXldO1xuICAgICAgICAgIGlmIChpc1ByaW1pdGl2ZVZhbHVlKHZhbHVlKSkge1xuICAgICAgICAgICAgcHJvcGVydGllc1trZXldID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBvYmogPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNQcmltaXRpdmVWYWx1ZSh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgfHxcbiAgICAgIHZhbHVlID09PSBudWxsO1xufVxuXG4vKipcbiAqIFdhbGsgdGhlIFROb2RlIHRyZWUgdG8gZmluZCBtYXRjaGVzIGZvciB0aGUgcHJlZGljYXRlLlxuICpcbiAqIEBwYXJhbSBwYXJlbnRFbGVtZW50IHRoZSBlbGVtZW50IGZyb20gd2hpY2ggdGhlIHdhbGsgaXMgc3RhcnRlZFxuICogQHBhcmFtIHByZWRpY2F0ZSB0aGUgcHJlZGljYXRlIHRvIG1hdGNoXG4gKiBAcGFyYW0gbWF0Y2hlcyB0aGUgbGlzdCBvZiBwb3NpdGl2ZSBtYXRjaGVzXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqL1xuZnVuY3Rpb24gX3F1ZXJ5QWxsKFxuICAgIHBhcmVudEVsZW1lbnQ6IERlYnVnRWxlbWVudCwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PiwgbWF0Y2hlczogRGVidWdFbGVtZW50W10sXG4gICAgZWxlbWVudHNPbmx5OiB0cnVlKTogdm9pZDtcbmZ1bmN0aW9uIF9xdWVyeUFsbChcbiAgICBwYXJlbnRFbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdLFxuICAgIGVsZW1lbnRzT25seTogZmFsc2UpOiB2b2lkO1xuZnVuY3Rpb24gX3F1ZXJ5QWxsKFxuICAgIHBhcmVudEVsZW1lbnQ6IERlYnVnRWxlbWVudCwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnxQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXXxEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuKSB7XG4gIGNvbnN0IGNvbnRleHQgPSBnZXRMQ29udGV4dChwYXJlbnRFbGVtZW50Lm5hdGl2ZU5vZGUpITtcbiAgY29uc3QgbFZpZXcgPSBjb250ZXh0ID8gY29udGV4dC5sVmlldyA6IG51bGw7XG4gIGlmIChsVmlldyAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHBhcmVudFROb2RlID0gbFZpZXdbVFZJRVddLmRhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuICAgIF9xdWVyeU5vZGVDaGlsZHJlbihcbiAgICAgICAgcGFyZW50VE5vZGUsIGxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcGFyZW50RWxlbWVudC5uYXRpdmVOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJZiB0aGUgY29udGV4dCBpcyBudWxsLCB0aGVuIGBwYXJlbnRFbGVtZW50YCB3YXMgZWl0aGVyIGNyZWF0ZWQgd2l0aCBSZW5kZXJlcjIgb3IgbmF0aXZlIERPTVxuICAgIC8vIEFQSXMuXG4gICAgX3F1ZXJ5TmF0aXZlTm9kZURlc2NlbmRhbnRzKHBhcmVudEVsZW1lbnQubmF0aXZlTm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHkpO1xuICB9XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgbWF0Y2ggdGhlIGN1cnJlbnQgVE5vZGUgYWdhaW5zdCB0aGUgcHJlZGljYXRlLCBhbmQgZ29lcyBvbiB3aXRoIHRoZSBuZXh0IG9uZXMuXG4gKlxuICogQHBhcmFtIHROb2RlIHRoZSBjdXJyZW50IFROb2RlXG4gKiBAcGFyYW0gbFZpZXcgdGhlIExWaWV3IG9mIHRoaXMgVE5vZGVcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKiBAcGFyYW0gcm9vdE5hdGl2ZU5vZGUgdGhlIHJvb3QgbmF0aXZlIG5vZGUgb24gd2hpY2ggcHJlZGljYXRlIHNob3VsZCBub3QgYmUgbWF0Y2hlZFxuICovXG5mdW5jdGlvbiBfcXVlcnlOb2RlQ2hpbGRyZW4oXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58UHJlZGljYXRlPERlYnVnTm9kZT4sXG4gICAgbWF0Y2hlczogRGVidWdFbGVtZW50W118RGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbiwgcm9vdE5hdGl2ZU5vZGU6IGFueSkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyh0Tm9kZSwgbFZpZXcpO1xuICBjb25zdCBuYXRpdmVOb2RlID0gZ2V0TmF0aXZlQnlUTm9kZU9yTnVsbCh0Tm9kZSwgbFZpZXcpO1xuICAvLyBGb3IgZWFjaCB0eXBlIG9mIFROb2RlLCBzcGVjaWZpYyBsb2dpYyBpcyBleGVjdXRlZC5cbiAgaWYgKHROb2RlLnR5cGUgJiAoVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpKSB7XG4gICAgLy8gQ2FzZSAxOiB0aGUgVE5vZGUgaXMgYW4gZWxlbWVudFxuICAgIC8vIFRoZSBuYXRpdmUgbm9kZSBoYXMgdG8gYmUgY2hlY2tlZC5cbiAgICBfYWRkUXVlcnlNYXRjaChuYXRpdmVOb2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIGlmIChpc0NvbXBvbmVudEhvc3QodE5vZGUpKSB7XG4gICAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyB0aGUgaG9zdCBvZiBhIGNvbXBvbmVudCwgdGhlbiBhbGwgbm9kZXMgaW4gaXRzIHZpZXcgaGF2ZSB0byBiZSBwcm9jZXNzZWQuXG4gICAgICAvLyBOb3RlOiB0aGUgY29tcG9uZW50J3MgY29udGVudCAodE5vZGUuY2hpbGQpIHdpbGwgYmUgcHJvY2Vzc2VkIGZyb20gdGhlIGluc2VydGlvbiBwb2ludHMuXG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KHROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgICBpZiAoY29tcG9uZW50VmlldyAmJiBjb21wb25lbnRWaWV3W1RWSUVXXS5maXJzdENoaWxkKSB7XG4gICAgICAgIF9xdWVyeU5vZGVDaGlsZHJlbihcbiAgICAgICAgICAgIGNvbXBvbmVudFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQhLCBjb21wb25lbnRWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSxcbiAgICAgICAgICAgIHJvb3ROYXRpdmVOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHROb2RlLmNoaWxkKSB7XG4gICAgICAgIC8vIE90aGVyd2lzZSwgaXRzIGNoaWxkcmVuIGhhdmUgdG8gYmUgcHJvY2Vzc2VkLlxuICAgICAgICBfcXVlcnlOb2RlQ2hpbGRyZW4odE5vZGUuY2hpbGQsIGxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBhbHNvIGhhdmUgdG8gcXVlcnkgdGhlIERPTSBkaXJlY3RseSBpbiBvcmRlciB0byBjYXRjaCBlbGVtZW50cyBpbnNlcnRlZCB0aHJvdWdoXG4gICAgICAvLyBSZW5kZXJlcjIuIE5vdGUgdGhhdCB0aGlzIGlzIF9fbm90X18gb3B0aW1hbCwgYmVjYXVzZSB3ZSdyZSB3YWxraW5nIHNpbWlsYXIgdHJlZXMgbXVsdGlwbGVcbiAgICAgIC8vIHRpbWVzLiBWaWV3RW5naW5lIGNvdWxkIGRvIGl0IG1vcmUgZWZmaWNpZW50bHksIGJlY2F1c2UgYWxsIHRoZSBpbnNlcnRpb25zIGdvIHRocm91Z2hcbiAgICAgIC8vIFJlbmRlcmVyMiwgaG93ZXZlciB0aGF0J3Mgbm90IHRoZSBjYXNlIGluIEl2eS4gVGhpcyBhcHByb2FjaCBpcyBiZWluZyB1c2VkIGJlY2F1c2U6XG4gICAgICAvLyAxLiBNYXRjaGluZyB0aGUgVmlld0VuZ2luZSBiZWhhdmlvciB3b3VsZCBtZWFuIHBvdGVudGlhbGx5IGludHJvZHVjaW5nIGEgZGVwZW5kZW5jeVxuICAgICAgLy8gICAgZnJvbSBgUmVuZGVyZXIyYCB0byBJdnkgd2hpY2ggY291bGQgYnJpbmcgSXZ5IGNvZGUgaW50byBWaWV3RW5naW5lLlxuICAgICAgLy8gMi4gSXQgYWxsb3dzIHVzIHRvIGNhcHR1cmUgbm9kZXMgdGhhdCB3ZXJlIGluc2VydGVkIGRpcmVjdGx5IHZpYSB0aGUgRE9NLlxuICAgICAgbmF0aXZlTm9kZSAmJiBfcXVlcnlOYXRpdmVOb2RlRGVzY2VuZGFudHMobmF0aXZlTm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHkpO1xuICAgIH1cbiAgICAvLyBJbiBhbGwgY2FzZXMsIGlmIGEgZHluYW1pYyBjb250YWluZXIgZXhpc3RzIGZvciB0aGlzIG5vZGUsIGVhY2ggdmlldyBpbnNpZGUgaXQgaGFzIHRvIGJlXG4gICAgLy8gcHJvY2Vzc2VkLlxuICAgIGNvbnN0IG5vZGVPckNvbnRhaW5lciA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgICBpZiAoaXNMQ29udGFpbmVyKG5vZGVPckNvbnRhaW5lcikpIHtcbiAgICAgIF9xdWVyeU5vZGVDaGlsZHJlbkluQ29udGFpbmVyKFxuICAgICAgICAgIG5vZGVPckNvbnRhaW5lciwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvLyBDYXNlIDI6IHRoZSBUTm9kZSBpcyBhIGNvbnRhaW5lclxuICAgIC8vIFRoZSBuYXRpdmUgbm9kZSBoYXMgdG8gYmUgY2hlY2tlZC5cbiAgICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgIF9hZGRRdWVyeU1hdGNoKGxDb250YWluZXJbTkFUSVZFXSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICAvLyBFYWNoIHZpZXcgaW5zaWRlIHRoZSBjb250YWluZXIgaGFzIHRvIGJlIHByb2Nlc3NlZC5cbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5JbkNvbnRhaW5lcihsQ29udGFpbmVyLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgIC8vIENhc2UgMzogdGhlIFROb2RlIGlzIGEgcHJvamVjdGlvbiBpbnNlcnRpb24gcG9pbnQgKGkuZS4gYSA8bmctY29udGVudD4pLlxuICAgIC8vIFRoZSBub2RlcyBwcm9qZWN0ZWQgYXQgdGhpcyBsb2NhdGlvbiBhbGwgbmVlZCB0byBiZSBwcm9jZXNzZWQuXG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGxWaWV3IVtERUNMQVJBVElPTl9DT01QT05FTlRfVklFV107XG4gICAgY29uc3QgY29tcG9uZW50SG9zdCA9IGNvbXBvbmVudFZpZXdbVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG4gICAgY29uc3QgaGVhZDogVE5vZGV8bnVsbCA9XG4gICAgICAgIChjb21wb25lbnRIb3N0LnByb2plY3Rpb24gYXMgKFROb2RlIHwgbnVsbClbXSlbdE5vZGUucHJvamVjdGlvbiBhcyBudW1iZXJdO1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaGVhZCkpIHtcbiAgICAgIGZvciAobGV0IG5hdGl2ZU5vZGUgb2YgaGVhZCkge1xuICAgICAgICBfYWRkUXVlcnlNYXRjaChuYXRpdmVOb2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaGVhZCkge1xuICAgICAgY29uc3QgbmV4dExWaWV3ID0gY29tcG9uZW50Vmlld1tQQVJFTlRdISBhcyBMVmlldztcbiAgICAgIGNvbnN0IG5leHRUTm9kZSA9IG5leHRMVmlld1tUVklFV10uZGF0YVtoZWFkLmluZGV4XSBhcyBUTm9kZTtcbiAgICAgIF9xdWVyeU5vZGVDaGlsZHJlbihuZXh0VE5vZGUsIG5leHRMVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUuY2hpbGQpIHtcbiAgICAvLyBDYXNlIDQ6IHRoZSBUTm9kZSBpcyBhIHZpZXcuXG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuKHROb2RlLmNoaWxkLCBsVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgfVxuXG4gIC8vIFdlIGRvbid0IHdhbnQgdG8gZ28gdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgcm9vdCBub2RlLlxuICBpZiAocm9vdE5hdGl2ZU5vZGUgIT09IG5hdGl2ZU5vZGUpIHtcbiAgICAvLyBUbyBkZXRlcm1pbmUgdGhlIG5leHQgbm9kZSB0byBiZSBwcm9jZXNzZWQsIHdlIG5lZWQgdG8gdXNlIHRoZSBuZXh0IG9yIHRoZSBwcm9qZWN0aW9uTmV4dFxuICAgIC8vIGxpbmssIGRlcGVuZGluZyBvbiB3aGV0aGVyIHRoZSBjdXJyZW50IG5vZGUgaGFzIGJlZW4gcHJvamVjdGVkLlxuICAgIGNvbnN0IG5leHRUTm9kZSA9ICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQpID8gdE5vZGUucHJvamVjdGlvbk5leHQgOiB0Tm9kZS5uZXh0O1xuICAgIGlmIChuZXh0VE5vZGUpIHtcbiAgICAgIF9xdWVyeU5vZGVDaGlsZHJlbihuZXh0VE5vZGUsIGxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFByb2Nlc3MgYWxsIFROb2RlcyBpbiBhIGdpdmVuIGNvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciB0aGUgY29udGFpbmVyIHRvIGJlIHByb2Nlc3NlZFxuICogQHBhcmFtIHByZWRpY2F0ZSB0aGUgcHJlZGljYXRlIHRvIG1hdGNoXG4gKiBAcGFyYW0gbWF0Y2hlcyB0aGUgbGlzdCBvZiBwb3NpdGl2ZSBtYXRjaGVzXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqIEBwYXJhbSByb290TmF0aXZlTm9kZSB0aGUgcm9vdCBuYXRpdmUgbm9kZSBvbiB3aGljaCBwcmVkaWNhdGUgc2hvdWxkIG5vdCBiZSBtYXRjaGVkXG4gKi9cbmZ1bmN0aW9uIF9xdWVyeU5vZGVDaGlsZHJlbkluQ29udGFpbmVyKFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58UHJlZGljYXRlPERlYnVnTm9kZT4sXG4gICAgbWF0Y2hlczogRGVidWdFbGVtZW50W118RGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbiwgcm9vdE5hdGl2ZU5vZGU6IGFueSkge1xuICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hpbGRWaWV3ID0gbENvbnRhaW5lcltpXSBhcyBMVmlldztcbiAgICBjb25zdCBmaXJzdENoaWxkID0gY2hpbGRWaWV3W1RWSUVXXS5maXJzdENoaWxkO1xuICAgIGlmIChmaXJzdENoaWxkKSB7XG4gICAgICBfcXVlcnlOb2RlQ2hpbGRyZW4oZmlyc3RDaGlsZCwgY2hpbGRWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1hdGNoIHRoZSBjdXJyZW50IG5hdGl2ZSBub2RlIGFnYWluc3QgdGhlIHByZWRpY2F0ZS5cbiAqXG4gKiBAcGFyYW0gbmF0aXZlTm9kZSB0aGUgY3VycmVudCBuYXRpdmUgbm9kZVxuICogQHBhcmFtIHByZWRpY2F0ZSB0aGUgcHJlZGljYXRlIHRvIG1hdGNoXG4gKiBAcGFyYW0gbWF0Y2hlcyB0aGUgbGlzdCBvZiBwb3NpdGl2ZSBtYXRjaGVzXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqIEBwYXJhbSByb290TmF0aXZlTm9kZSB0aGUgcm9vdCBuYXRpdmUgbm9kZSBvbiB3aGljaCBwcmVkaWNhdGUgc2hvdWxkIG5vdCBiZSBtYXRjaGVkXG4gKi9cbmZ1bmN0aW9uIF9hZGRRdWVyeU1hdGNoKFxuICAgIG5hdGl2ZU5vZGU6IGFueSwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnxQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXXxEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuLCByb290TmF0aXZlTm9kZTogYW55KSB7XG4gIGlmIChyb290TmF0aXZlTm9kZSAhPT0gbmF0aXZlTm9kZSkge1xuICAgIGNvbnN0IGRlYnVnTm9kZSA9IGdldERlYnVnTm9kZShuYXRpdmVOb2RlKTtcbiAgICBpZiAoIWRlYnVnTm9kZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBUeXBlIG9mIHRoZSBcInByZWRpY2F0ZSBhbmQgXCJtYXRjaGVzXCIgYXJyYXkgYXJlIHNldCBiYXNlZCBvbiB0aGUgdmFsdWUgb2ZcbiAgICAvLyB0aGUgXCJlbGVtZW50c09ubHlcIiBwYXJhbWV0ZXIuIFR5cGVTY3JpcHQgaXMgbm90IGFibGUgdG8gcHJvcGVybHkgaW5mZXIgdGhlc2VcbiAgICAvLyB0eXBlcyB3aXRoIGdlbmVyaWNzLCBzbyB3ZSBtYW51YWxseSBjYXN0IHRoZSBwYXJhbWV0ZXJzIGFjY29yZGluZ2x5LlxuICAgIGlmIChlbGVtZW50c09ubHkgJiYgKGRlYnVnTm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudCkgJiYgcHJlZGljYXRlKGRlYnVnTm9kZSkgJiZcbiAgICAgICAgbWF0Y2hlcy5pbmRleE9mKGRlYnVnTm9kZSkgPT09IC0xKSB7XG4gICAgICBtYXRjaGVzLnB1c2goZGVidWdOb2RlKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICAhZWxlbWVudHNPbmx5ICYmIChwcmVkaWNhdGUgYXMgUHJlZGljYXRlPERlYnVnTm9kZT4pKGRlYnVnTm9kZSkgJiZcbiAgICAgICAgKG1hdGNoZXMgYXMgRGVidWdOb2RlW10pLmluZGV4T2YoZGVidWdOb2RlKSA9PT0gLTEpIHtcbiAgICAgIChtYXRjaGVzIGFzIERlYnVnTm9kZVtdKS5wdXNoKGRlYnVnTm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTWF0Y2ggYWxsIHRoZSBkZXNjZW5kYW50cyBvZiBhIERPTSBub2RlIGFnYWluc3QgYSBwcmVkaWNhdGUuXG4gKlxuICogQHBhcmFtIG5hdGl2ZU5vZGUgdGhlIGN1cnJlbnQgbmF0aXZlIG5vZGVcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgd2hlcmUgbWF0Y2hlcyBhcmUgc3RvcmVkXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqL1xuZnVuY3Rpb24gX3F1ZXJ5TmF0aXZlTm9kZURlc2NlbmRhbnRzKFxuICAgIHBhcmVudE5vZGU6IGFueSwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnxQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXXxEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuKSB7XG4gIGNvbnN0IG5vZGVzID0gcGFyZW50Tm9kZS5jaGlsZE5vZGVzO1xuICBjb25zdCBsZW5ndGggPSBub2Rlcy5sZW5ndGg7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICBjb25zdCBkZWJ1Z05vZGUgPSBnZXREZWJ1Z05vZGUobm9kZSk7XG5cbiAgICBpZiAoZGVidWdOb2RlKSB7XG4gICAgICBpZiAoZWxlbWVudHNPbmx5ICYmIChkZWJ1Z05vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnQpICYmIHByZWRpY2F0ZShkZWJ1Z05vZGUpICYmXG4gICAgICAgICAgbWF0Y2hlcy5pbmRleE9mKGRlYnVnTm9kZSkgPT09IC0xKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChkZWJ1Z05vZGUpO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAhZWxlbWVudHNPbmx5ICYmIChwcmVkaWNhdGUgYXMgUHJlZGljYXRlPERlYnVnTm9kZT4pKGRlYnVnTm9kZSkgJiZcbiAgICAgICAgICAobWF0Y2hlcyBhcyBEZWJ1Z05vZGVbXSkuaW5kZXhPZihkZWJ1Z05vZGUpID09PSAtMSkge1xuICAgICAgICAobWF0Y2hlcyBhcyBEZWJ1Z05vZGVbXSkucHVzaChkZWJ1Z05vZGUpO1xuICAgICAgfVxuXG4gICAgICBfcXVlcnlOYXRpdmVOb2RlRGVzY2VuZGFudHMobm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHkpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGVzIHRocm91Z2ggdGhlIHByb3BlcnR5IGJpbmRpbmdzIGZvciBhIGdpdmVuIG5vZGUgYW5kIGdlbmVyYXRlc1xuICogYSBtYXAgb2YgcHJvcGVydHkgbmFtZXMgdG8gdmFsdWVzLiBUaGlzIG1hcCBvbmx5IGNvbnRhaW5zIHByb3BlcnR5IGJpbmRpbmdzXG4gKiBkZWZpbmVkIGluIHRlbXBsYXRlcywgbm90IGluIGhvc3QgYmluZGluZ3MuXG4gKi9cbmZ1bmN0aW9uIGNvbGxlY3RQcm9wZXJ0eUJpbmRpbmdzKFxuICAgIHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgdERhdGE6IFREYXRhKTogdm9pZCB7XG4gIGxldCBiaW5kaW5nSW5kZXhlcyA9IHROb2RlLnByb3BlcnR5QmluZGluZ3M7XG5cbiAgaWYgKGJpbmRpbmdJbmRleGVzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5kaW5nSW5kZXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gYmluZGluZ0luZGV4ZXNbaV07XG4gICAgICBjb25zdCBwcm9wTWV0YWRhdGEgPSB0RGF0YVtiaW5kaW5nSW5kZXhdIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IG1ldGFkYXRhUGFydHMgPSBwcm9wTWV0YWRhdGEuc3BsaXQoSU5URVJQT0xBVElPTl9ERUxJTUlURVIpO1xuICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gbWV0YWRhdGFQYXJ0c1swXTtcbiAgICAgIGlmIChtZXRhZGF0YVBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gbWV0YWRhdGFQYXJ0c1sxXTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPCBtZXRhZGF0YVBhcnRzLmxlbmd0aCAtIDE7IGorKykge1xuICAgICAgICAgIHZhbHVlICs9IHJlbmRlclN0cmluZ2lmeShsVmlld1tiaW5kaW5nSW5kZXggKyBqIC0gMV0pICsgbWV0YWRhdGFQYXJ0c1tqICsgMV07XG4gICAgICAgIH1cbiAgICAgICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0gdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gPSBsVmlld1tiaW5kaW5nSW5kZXhdO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8vIE5lZWQgdG8ga2VlcCB0aGUgbm9kZXMgaW4gYSBnbG9iYWwgTWFwIHNvIHRoYXQgbXVsdGlwbGUgYW5ndWxhciBhcHBzIGFyZSBzdXBwb3J0ZWQuXG5jb25zdCBfbmF0aXZlTm9kZVRvRGVidWdOb2RlID0gbmV3IE1hcDxhbnksIERlYnVnTm9kZT4oKTtcblxuY29uc3QgTkdfREVCVUdfUFJPUEVSVFkgPSAnX19uZ19kZWJ1Z19fJztcblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGUobmF0aXZlTm9kZTogYW55KTogRGVidWdOb2RlfG51bGwge1xuICBpZiAobmF0aXZlTm9kZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICBpZiAoIShuYXRpdmVOb2RlLmhhc093blByb3BlcnR5KE5HX0RFQlVHX1BST1BFUlRZKSkpIHtcbiAgICAgIChuYXRpdmVOb2RlIGFzIGFueSlbTkdfREVCVUdfUFJPUEVSVFldID0gbmF0aXZlTm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSA/XG4gICAgICAgICAgbmV3IERlYnVnRWxlbWVudChuYXRpdmVOb2RlIGFzIEVsZW1lbnQpIDpcbiAgICAgICAgICBuZXcgRGVidWdOb2RlKG5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gKG5hdGl2ZU5vZGUgYXMgYW55KVtOR19ERUJVR19QUk9QRVJUWV07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8vIFRPRE86IGNsZWFudXAgYWxsIHJlZmVyZW5jZXMgdG8gdGhpcyBmdW5jdGlvbiBhbmQgcmVtb3ZlIGl0LlxuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZVIyKF9uYXRpdmVOb2RlOiBhbnkpOiBEZWJ1Z05vZGV8bnVsbCB7XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsRGVidWdOb2RlcygpOiBEZWJ1Z05vZGVbXSB7XG4gIHJldHVybiBBcnJheS5mcm9tKF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUudmFsdWVzKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhEZWJ1Z05vZGUobm9kZTogRGVidWdOb2RlKSB7XG4gIF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUuc2V0KG5vZGUubmF0aXZlTm9kZSwgbm9kZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVEZWJ1Z05vZGVGcm9tSW5kZXgobm9kZTogRGVidWdOb2RlKSB7XG4gIF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUuZGVsZXRlKG5vZGUubmF0aXZlTm9kZSk7XG59XG5cbi8qKlxuICogQSBib29sZWFuLXZhbHVlZCBmdW5jdGlvbiBvdmVyIGEgdmFsdWUsIHBvc3NpYmx5IGluY2x1ZGluZyBjb250ZXh0IGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgdGhhdCB2YWx1ZSdzIHBvc2l0aW9uIGluIGFuIGFycmF5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcmVkaWNhdGU8VD4ge1xuICAodmFsdWU6IFQpOiBib29sZWFuO1xufVxuIl19