var u = require('./util')
var map = u.map
var simple = require('./basic')
var search = require('binary-search')

function isFunction (f) { return 'function' === typeof f }

function isSimple(query) {
  for(var k in simple) if(u.has(query, k)) return k
}

function lookup(reduce, path) {
  if(path === true) return reduce
  return function (a, b) {
    return reduce(a, u.get(b, path))
  }
}

function multi(obj) {
  return function (a, b) {
    return map(obj, function (reduce, k) {
      return reduce(a[k], b)
    }, a = a || {})
  }
}

function each(list, iter) {
  if(u.isString(list)) return iter(list)
  for(var i = 0; i < list.length; i++)
    iter(list[i], (list.length - i - 1))
}

function group (g, reduce) {

  function compare (a, b) {
    for(var i in g) {
      var x = u.get(a, g[i])
      var y = u.get(b, g[i])
      if(x != y) return x < y ? -1 : 1
    }
    return 0
  }

  return function (a, b) {
    var A = a = a || []
    var i = search(A, b, compare)

    if(i >= 0) A[i] = reduce(A[i], b)
    else       A.splice(~i, 0, reduce(undefined, b))

    return a
  }
}


function make (query) {
  var k = isSimple(query)
  if(k) return lookup(simple[k], query[k])
  else if(u.isObject(query))
    return multi(map(query, function (q, k) {
      if(k == '$group') return undefined
      return make(query[k])
    }))
  else return function (a, b) {
    return b[query]
  }
}

function gmake (query) {
  if(isSimple(query)) return make(query)

  var paths = []
  function isMap (e) {
    return !isSimple(e) ? (paths.push(e), e) : undefined
  }
  function isObj (e) {
    return u.isObject(e) && !isSimple(e)
  }
  var maps = u.project(query, isMap, isObj)

  return paths.length ? group(paths, make(query)) : make(query)
}

module.exports = gmake




