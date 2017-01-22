var append = require('append-child')
var test = require('tape')

var choo = require('../../')
var html = require('../../html')

test('state is immutable', function (t) {
  t.plan(4)

  var app = choo()
  var state = {
    foo: 'baz',
    beep: 'boop'
  }

  app.model({
    state: state,
    namespace: 'test',
    reducers: {
      'no-reducer-mutate': (state, data) => {
        return {}
      },
      'mutate-on-return': (state, data) => {
        delete data.type
        return data
      }
    },
    effects: {
      'triggers-reducers': (state, data, send, done) => {
        send('test:mutate-on-return', {beep: 'barp'}, done)
      }
    }
  })

  let loop = -1

  var asserts = [
    (state) => t.deepEqual(state, {foo: 'baz', beep: 'boop'}, 'intial state'),
    (state) => t.deepEqual(state, {foo: 'baz', beep: 'boop'}, 'no change in state'),
    (state) => t.deepEqual(state, {foo: 'oof', beep: 'boop'}, 'change in state from reducer'),
    (state) => t.deepEqual(state, {foo: 'oof', beep: 'barp'}, 'change in state from effect')
  ]

  var triggers = [
    (send) => send('test:no-reducer-mutate'),
    (send) => send('test:mutate-on-return', {foo: 'oof'}),
    (send) => send('test:triggers-reducers')
  ]

  app.router([
    ['/', function (state, prev, send) {
      ++loop
      asserts[loop] && asserts[loop](state.test)
      setTimeout(() => triggers[loop] && triggers[loop](send), 5)
      return html`
        <div><span class="test">${state.foo}:${state.beep}</span></div>
      `
    }]
  ])

  var tree = app.start()
  t.on('end', append(tree))
})
