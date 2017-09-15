import Data from './dom/data'
import EventHandler from './dom/eventHandler'
import SelectorEngine from './dom/selectorEngine'
import Util from './util'

/**
 * --------------------------------------------------------------------------
 * Bootstrap (v4.0.0-beta): collapse.js
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

const Collapse = (() => {


  /**
   * ------------------------------------------------------------------------
   * Constants
   * ------------------------------------------------------------------------
   */

  const NAME                = 'collapse'
  const VERSION             = '4.0.0-beta'
  const DATA_KEY            = 'bs.collapse'
  const EVENT_KEY           = `.${DATA_KEY}`
  const DATA_API_KEY        = '.data-api'
  const TRANSITION_DURATION = 600

  const Default = {
    toggle : true,
    parent : ''
  }

  const DefaultType = {
    toggle : 'boolean',
    parent : 'string'
  }

  const Event = {
    SHOW           : `show${EVENT_KEY}`,
    SHOWN          : `shown${EVENT_KEY}`,
    HIDE           : `hide${EVENT_KEY}`,
    HIDDEN         : `hidden${EVENT_KEY}`,
    CLICK_DATA_API : `click${EVENT_KEY}${DATA_API_KEY}`
  }

  const ClassName = {
    SHOW       : 'show',
    COLLAPSE   : 'collapse',
    COLLAPSING : 'collapsing',
    COLLAPSED  : 'collapsed'
  }

  const Dimension = {
    WIDTH  : 'width',
    HEIGHT : 'height'
  }

  const Selector = {
    ACTIVES     : '.show, .collapsing',
    DATA_TOGGLE : '[data-toggle="collapse"]'
  }


  /**
   * ------------------------------------------------------------------------
   * Class Definition
   * ------------------------------------------------------------------------
   */

  class Collapse {

    constructor(element, config) {
      this._isTransitioning = false
      this._element         = element
      this._config          = this._getConfig(config)
      this._triggerArray    = Util.makeArray(SelectorEngine.find(
        `[data-toggle="collapse"][href="#${element.id}"],` +
        `[data-toggle="collapse"][data-target="#${element.id}"]`
      ))

      const tabToggles = SelectorEngine.find(Selector.DATA_TOGGLE)
      for (let i = 0; i < tabToggles.length; i++) {
        const elem = tabToggles[i]
        const selector = Util.getSelectorFromElement(elem)
        if (selector !== null && SelectorEngine.matches(element, selector)) {
          this._triggerArray.push(elem)
        }
      }

      this._parent = this._config.parent ? this._getParent() : null

      if (!this._config.parent) {
        this._addAriaAndCollapsedClass(this._element, this._triggerArray)
      }

      if (this._config.toggle) {
        this.toggle()
      }
    }


    // getters

    static get VERSION() {
      return VERSION
    }

    static get Default() {
      return Default
    }


    // public

    toggle() {
      if (this._element.classList.contains(ClassName.SHOW)) {
        this.hide()
      } else {
        this.show()
      }
    }

    show() {
      if (this._isTransitioning ||
        this._element.classList.contains(ClassName.SHOW)) {
        return
      }

      let actives
      let activesData

      if (this._parent) {
        actives = Util.makeArray(SelectorEngine.find(Selector.ACTIVES, this._parent.children.children))
        if (!actives.length) {
          actives = null
        }
      }

      if (actives) {
        activesData = Data.getData(actives, DATA_KEY)
        if (activesData && activesData._isTransitioning) {
          return
        }
      }

      const startEvent = EventHandler.trigger(this._element, Event.SHOW)
      if (startEvent.defaultPrevented) {
        return
      }

      if (actives) {
        actives.forEach((elemActive) => {
          Collapse._collapseInterface(elemActive, 'hide')
        })
        if (!activesData) {
          Data.setData(actives, DATA_KEY, null)
        }
      }

      const dimension = this._getDimension()

      this._element.classList.remove(ClassName.COLLAPSE)
      this._element.classList.add(ClassName.COLLAPSING)

      this._element.style[dimension] = 0

      if (this._triggerArray.length) {
        this._triggerArray.forEach((element) => {
          element.classList.remove(ClassName.COLLAPSED)
          element.setAttribute('aria-expanded', true)
        })
      }

      this.setTransitioning(true)

      const complete = () => {
        this._element.classList.remove(ClassName.COLLAPSING)
        this._element.classList.add(ClassName.COLLAPSE)
        this._element.classList.add(ClassName.SHOW)

        this._element.style[dimension] = ''

        this.setTransitioning(false)

        EventHandler.trigger(this._element, Event.SHOWN)
      }

      if (!Util.supportsTransitionEnd()) {
        complete()
        return
      }

      const capitalizedDimension = dimension[0].toUpperCase() + dimension.slice(1)
      const scrollSize           = `scroll${capitalizedDimension}`

      EventHandler.one(this._element, Util.TRANSITION_END, complete)

      Util.emulateTransitionEnd(this._element, TRANSITION_DURATION)

      this._element.style[dimension] = `${this._element[scrollSize]}px`
    }

    hide() {
      if (this._isTransitioning ||
        !this._element.classList.contains(ClassName.SHOW)) {
        return
      }

      const startEvent = EventHandler.trigger(this._element, Event.HIDE)
      if (startEvent.defaultPrevented) {
        return
      }

      const dimension = this._getDimension()

      this._element.style[dimension] = `${this._element.getBoundingClientRect()[dimension]}px`

      Util.reflow(this._element)

      this._element.classList.add(ClassName.COLLAPSING)
      this._element.classList.remove(ClassName.COLLAPSE)
      this._element.classList.remove(ClassName.SHOW)

      if (this._triggerArray.length) {
        for (let i = 0; i < this._triggerArray.length; i++) {
          const trigger = this._triggerArray[i]
          const selector = Util.getSelectorFromElement(trigger)
          if (selector !== null) {
            const elem = SelectorEngine.findOne(selector)
            if (!elem.classList.contains(ClassName.SHOW)) {
              trigger.classList.add(ClassName.COLLAPSED)
              trigger.setAttribute('aria-expanded', false)
            }
          }
        }
      }

      this.setTransitioning(true)

      const complete = () => {
        this.setTransitioning(false)
        this._element.classList.remove(ClassName.COLLAPSING)
        this._element.classList.add(ClassName.COLLAPSE)
        EventHandler.trigger(this._element, Event.HIDDEN)
      }

      this._element.style[dimension] = ''

      if (!Util.supportsTransitionEnd()) {
        complete()
        return
      }

      EventHandler.one(this._element, Util.TRANSITION_END, complete)
      Util.emulateTransitionEnd(this._element, TRANSITION_DURATION)
    }

    setTransitioning(isTransitioning) {
      this._isTransitioning = isTransitioning
    }

    dispose() {
      Data.removeData(this._element, DATA_KEY)

      this._config          = null
      this._parent          = null
      this._element         = null
      this._triggerArray    = null
      this._isTransitioning = null
    }

    // private

    _getConfig(config) {
      config = Util.extend(Util.extend({}, Default), config)
      config.toggle = Boolean(config.toggle) // coerce string values
      Util.typeCheckConfig(NAME, config, DefaultType)
      return config
    }

    _getDimension() {
      const hasWidth = this._element.classList.contains(Dimension.WIDTH)
      return hasWidth ? Dimension.WIDTH : Dimension.HEIGHT
    }

    _getParent() {
      const parent   = SelectorEngine.findOne(this._config.parent)
      const selector =
        `[data-toggle="collapse"][data-parent="${this._config.parent}"]`

      const elements = Util.makeArray(SelectorEngine.find(selector, parent))
      elements.forEach((element) => {
        this._addAriaAndCollapsedClass(
          Collapse._getTargetFromElement(element),
          [element]
        )
      })

      return parent
    }

    _addAriaAndCollapsedClass(element, triggerArray) {
      if (element) {
        const isOpen = element.classList.contains(ClassName.SHOW)

        if (triggerArray.length) {
          triggerArray.forEach((elem) => {
            if (elem.classList.contains(ClassName.COLLAPSED)) {
              elem.classList.remove(ClassName.COLLAPSED)
            } else {
              elem.classList.add(ClassName.COLLAPSED)
            }
            elem.setAttribute('aria-expanded', !isOpen)
          })
        }
      }
    }

    // static

    static _getTargetFromElement(element) {
      const selector = Util.getSelectorFromElement(element)
      return selector ? SelectorEngine.findOne(selector) : null
    }

    static _collapseInterface(element, config) {
      let data      = Data.getData(element, DATA_KEY)
      const _config = $.extend(
        {},
        Default,
        Util.getDataAttributes(element),
        typeof config === 'object' && config
      )

      if (!data && _config.toggle && /show|hide/.test(config)) {
        _config.toggle = false
      }

      if (!data) {
        data = new Collapse(element, _config)
        Data.setData(element, DATA_KEY, data)
      }

      if (typeof config === 'string') {
        if (typeof data[config] === 'undefined') {
          throw new Error(`No method named "${config}"`)
        }
        data[config]()
      }
    }

    static _jQueryInterface(config) {
      return this.each(function () {
        Collapse._collapseInterface(this, config)
      })
    }

  }


  /**
   * ------------------------------------------------------------------------
   * Data Api implementation
   * ------------------------------------------------------------------------
   */

  EventHandler.on(document, Event.CLICK_DATA_API, Selector.DATA_TOGGLE, function (event) {
    // preventDefault only for <a> elements (which change the URL) not inside the collapsible element
    if (event.target.tagName === 'A') {
      event.preventDefault()
    }

    const triggerData      = Util.getDataAttributes(this)
    const selector         = Util.getSelectorFromElement(this)
    const selectorElements = Util.makeArray(SelectorEngine.find(selector))

    selectorElements.forEach((element) => {
      const data    = Data.getData(element, DATA_KEY)
      const config  = data ? 'toggle' : triggerData
      Collapse._collapseInterface(element, config)
    })
  })


  /**
   * ------------------------------------------------------------------------
   * jQuery
   * ------------------------------------------------------------------------
   * add .collapse to jQuery only if jQuery is present
   */

  if (typeof window.$ !== 'undefined' || typeof window.jQuery !== 'undefined') {
    const $                   = window.$ || window.jQuery
    const JQUERY_NO_CONFLICT  = $.fn[NAME]
    $.fn[NAME]                = Collapse._jQueryInterface
    $.fn[NAME].Constructor    = Collapse
    $.fn[NAME].noConflict     = function () {
      $.fn[NAME] = JQUERY_NO_CONFLICT
      return Collapse._jQueryInterface
    }
  }

  return Collapse

})()

export default Collapse
