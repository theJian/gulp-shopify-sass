// TODO: not done
/*
 * Goal: create scss syntax parser to replace RegExp, in order to add extra features, such as
 *       1. Regonize @import in comments and do not replace it
 *       2. Support includePaths option to minimize @import path length in each file
 */

{
    var unroll = options.util.makeUnroll(location, options)
    var ast    = options.util.makeAST   (location, options)
}
 
start
    = _ seq:id_seq _ {
          return ast("Sample").add(seq)
      }
 
id_seq
    = id:id ids:(_ "," _ id)* {
          return ast("IdentifierSequence").add(unroll(id, ids, 3))
      }
 
id
    = id:$([a-zA-Z_][a-zA-Z0-9_]*) {
          return ast("Identifier").set("name", id)
      }
 
_ "blank"
    = (co / ws)*
 
co "comment"
    = "//" (![\r\n] .)*
    / "/*" (!"*/" .)* "*/"
 
ws "whitespaces"
    = [ \t\r\n]+