/**
 * ✔ hover-class
 * ✘ hover-stop-propagation
 * ✔ hover-start-time
 * ✔ hover-stay-time
 */
import { View, Text, ViewStyle, NativeSyntheticEvent, ImageProps, ImageResizeMode, StyleSheet, Image } from 'react-native'
import React, { useRef, useState, useEffect, forwardRef, Children, ForwardedRef } from 'react'

// @ts-ignore
import useInnerProps from './getInnerListeners'
// @ts-ignore
import useNodesRef from '../../useNodesRef' // 引入辅助函数

import { parseUrl, hasElementType, TEXT_STYLE_REGEX, PERCENT_REGX } from './utils'

type ElementNode = React.ReactNode

type ExtendedViewStyle = ViewStyle & {
  backgroundImage?: string
  backgroundSize?: ImageResizeMode
}

export interface _ViewProps extends ExtendedViewStyle {
  style?: Array<ExtendedViewStyle>
  children?: ElementNode
  hoverStyle: Array<ExtendedViewStyle>
  ['hover-start-time']: number
  ['hover-stay-time']: number
  'enable-offset'?: boolean
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

type GroupData = {
  [key: string]: ExtendedViewStyle
}

type Handler = (val: string, imageProps: ImageProps) => void

const IMAGE_STYLE_REGEX = /^background(Image|Size|Repeat|Position)$/

function groupBy(style, callback, group = {}):GroupData {
  let groupKey = ''
  for (let key in style) {
    let val = style[key]
    groupKey = callback(key, val)
    if (!group[groupKey]) {
      group[groupKey] = {}
    }
    group[groupKey][key] = val
  }
  return group
}

const applyHandlers = (handlers: Handler[] , options) => {
  const [ imageStyle, imageProps ] = options
  for (let key in handlers) {
    const handler = handlers[key]
    const val = imageStyle[handler.name]
    handler && val && handler(val, imageProps)
  }
}

const imageStyleToProps = (imageStyle: ExtendedViewStyle) => {
  if (!imageStyle) return null
  // 初始化
  const imageProps: ImageProps = {
    style: {
      resizeMode: 'cover',
      ...StyleSheet.absoluteFillObject
    }
  }

  // background-size 转换
  function backgroundSize (val, imageProps) {
    // 枚举值
    if (['cover', 'contain'].includes(val)) {
      imageProps.style.resizeMode = val
    } else {
      let sizeList = val.trim().split(/\s+/)
      //  归一化
      if (sizeList.length === 1) {
        sizeList.push(sizeList[0])
      }

      const style = sizeList.reduce((style, val, idx) => {
        if (idx === 0) {
          style.width =  PERCENT_REGX.test(val) ? val : +val
        }else {
          style.height = PERCENT_REGX.test(val) ? val : +val
        }
        return style
      }, {})
      
      // 样式合并
      imageProps.style = {
        ...imageProps.style,
        ...style
      }
    }
  }
  // background-image转换为source
  function backgroundImage(val, imageProps) {
    const url = parseUrl(val)
    if (!url) return null
    imageProps.source = {uri: url}
  }

  applyHandlers([ backgroundSize, backgroundImage ],[imageStyle, imageProps])

  if (!imageProps?.source) return null  
  
  return imageProps
}

function splitStyle(styles: ExtendedViewStyle) {
  return groupBy(styles, (key) => {
    if (TEXT_STYLE_REGEX.test(key))
      return 'textStyle'
    else if (IMAGE_STYLE_REGEX.test(key)) return 'imageStyle'
    return 'innerStyle'
  }, {})
}

const isText = (children: ElementNode) => {
  return hasElementType(children, 'mpx-text') || hasElementType(children, 'Text')
}

function every(children: ElementNode, callback: (children: ElementNode) => boolean ) {
  return Children.toArray(children).every((child) => callback(child as ElementNode))
}

function wrapChildren(children: ElementNode, textStyle?: ExtendedViewStyle, imageStyle?: ExtendedViewStyle) {
  if (every(children, (child)=>isText(child))) {
    children = <Text style={textStyle}>{children}</Text>
  } else {
    if(textStyle) console.warn('Text style will be ignored unless every child of the view is Text node!')
  }

  const bgImage = imageStyleToProps(imageStyle)

  console.log(">>> bgImage", bgImage)


  return [
    bgImage && <Image {...bgImage}/>,
    children
  ]
}

const _View = forwardRef((props: _ViewProps, ref: ForwardedRef<any>): React.JSX.Element => {
  const {
    style = [],
    children,
    hoverStyle,
    'hover-start-time': hoverStartTime = 50,
    'hover-stay-time': hoverStayTime = 400,
    'enable-offset': enableOffset
  } = props

  const [isHover, setIsHover] = useState(false)
  const measureTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null)


  const layoutRef = useRef({})

  // 打平 style 数组
  const styleObj:ExtendedViewStyle = StyleSheet.flatten(style)
  // 默认样式
  const defaultStyle:ExtendedViewStyle = {
    // flex 布局相关的默认样式
    ...styleObj.display === 'flex' && {
      flexDirection: 'row',
      flexBasis: 'auto',
      flexShrink: 1,
      flexWrap: 'nowrap'
    }
  }

  const { nodeRef } = useNodesRef(props, ref, {
    defaultStyle
  })

  const dataRef = useRef<{
    startTimer?: ReturnType<typeof setTimeout>
    stayTimer?: ReturnType<typeof setTimeout>
  }>()

  useEffect(() => {
    return () => {
      dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer)
      dataRef.current.stayTimer && clearTimeout(dataRef.current.stayTimer)
    }
  }, [])

  const setStartTimer = () => {
    dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer)
    dataRef.current.startTimer = setTimeout(() => {
      setIsHover(() => true)
    }, hoverStartTime)
  }

  const setStayTimer = () => {
    dataRef.current.stayTimer && clearTimeout(dataRef.current.stayTimer)
    dataRef.current.stayTimer = setTimeout(() => {
      setIsHover(() => false)
    }, hoverStayTime)
  }

  function onTouchStart(e: NativeSyntheticEvent<TouchEvent>){
    const { bindtouchstart } = props;
    bindtouchstart && bindtouchstart(e)
    setStartTimer()
  }

  function onTouchEnd(e: NativeSyntheticEvent<TouchEvent>){
    const { bindtouchend } = props;
    bindtouchend && bindtouchend(e)
    setStayTimer()
  }

  const onLayout = () => {
    nodeRef.current?.measure((x, y, width, height, offsetLeft, offsetTop) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
  }

  const innerProps = useInnerProps(props, {
    ref: nodeRef,
    ...(enableOffset ? { onLayout } : {}),
    ...(hoverStyle && {
      bindtouchstart: onTouchStart,
      bindtouchend: onTouchEnd
    })
  }, [
    'style',
    'children',
    'hover-start-time',
    'hover-stay-time',
    'hoverStyle',
    'hover-class',
    'enable-offset'
  ])

  React.useEffect(() => {
    setTimeout(() => {
      nodeRef.current = nodeRef.current.measure((x, y, width, height, offsetLeft, offsetTop) => {
        nodeRef.current = { x, y, width, height, offsetLeft, offsetTop }
      })
    })
    return () => {
      measureTimeout.current && clearTimeout(measureTimeout.current);
      measureTimeout.current = null
    }
  }, [nodeRef])

  const {textStyle, imageStyle, innerStyle} = splitStyle(StyleSheet.flatten<ExtendedViewStyle>([ 
    defaultStyle,
    styleObj,
    ...(isHover ? hoverStyle : [])]
  ))

  return (
    <View
      ref={nodeRef}
      {...innerProps}
      style={innerStyle}
    >
      {wrapChildren(children, textStyle, imageStyle)}
    </View>
  )
})

_View.displayName = 'mpx-view'

export default _View

