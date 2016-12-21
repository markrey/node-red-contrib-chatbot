var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var MessageBlock = require('../chatbot-message');

var NplMatcher = require('../lib/npl-matcher');

describe('NLP matcher', function() {

  it('should init, get some terms, tail a terms', function() {

    var message = 'the check is 36 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);

    assert.equal(terms.head().text, 'the');
    assert.equal(terms.head().tag, 'Determiner');
    assert.equal(terms.head().pos.Determiner, true);

    assert.equal(terms.at(1).text, 'check');
    assert.equal(terms.at(1).tag, 'Noun');
    assert.equal(terms.at(1).pos.Noun, true);

    var tailed = terms.tail();

    assert.equal(tailed.at(0).text, 'check');
    assert.equal(tailed.at(0).tag, 'Noun');
    assert.equal(tailed.at(0).pos.Noun, true);


  });

  it('should create a rule from string', function() {

    var rule = new NplMatcher.MatchRule('check[noun]->myvariable');

    assert.equal(rule.text, 'check');
    assert.equal(rule.type, 'noun');
    assert.equal(rule.variable, 'myvariable');

    rule = new NplMatcher.MatchRule('[adjective]->var2');

    assert.isNull(rule.text);
    assert.equal(rule.type, 'adjective');
    assert.equal(rule.variable, 'var2');

    rule = new NplMatcher.MatchRule('[currency]');

    assert.isNull(rule.text);
    assert.equal(rule.type, 'currency');
    assert.isNull(rule.variable);


  });


  it('should clone properly a rule', function() {

    var rule = new NplMatcher.MatchRule({
      text: 'check',
      type: 'noun',
      variable: '42'
    });

    assert.equal(rule.text, 'check');
    assert.equal(rule.type, 'noun');
    assert.equal(rule.variable, '42');

    var cloned = rule.clone();
    cloned.variable = '84';

    assert.equal(rule.text, 'check');
    assert.equal(rule.type, 'noun');
    assert.equal(rule.variable, '42');

    assert.equal(cloned.text, 'check');
    assert.equal(cloned.type, 'noun');
    assert.equal(cloned.variable, '84');


  });

  it('should create return a json list rules', function() {

    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      }
    ]);

    var json = rules.toJSON();

    assert.isArray(json);

    assert.isObject(json[0]);
    assert.equal(json[0].text, 'check');
    assert.equal(json[0].type, 'noun');
    assert.isNull(json[0].variable);

    assert.isObject(json[1]);
    assert.isNull(json[1].text);
    assert.equal(json[1].type, 'number');
    assert.equal(json[1].variable, 'total');

    assert.isObject(json[2]);
    assert.isNull(json[2].text);
    assert.equal(json[2].type, 'currency');
    assert.equal(json[2].variable, 'currency');


  });

  it('should tail a list of rules', function() {

    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      }
    ]);

    var tailed = rules.tail();

    assert.equal(tailed.count(), 2);

    assert.isNull(tailed.at(0).text);
    assert.equal(tailed.at(0).type, 'number');
    assert.equal(tailed.at(0).variable, 'total');

    assert.isNull(tailed.at(1).text);
    assert.equal(tailed.at(1).type, 'currency');
    assert.equal(tailed.at(1).variable, 'currency');

    // now prepend

    tailed.prepend(new NplMatcher.MatchRule({
      text: 'front',
      type: 'noun'
    }));

    assert.equal(tailed.at(0).text, 'front');
    assert.equal(tailed.at(0).type, 'noun');

  });


  it('should match if type is the same and text is the same', function() {

    var message = 'the check is 36 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      }
    ]);

    assert.isTrue(rules.at(0).match(terms.at(1)));


  });

  it('should match a type number without text and store the value', function() {

    var message = 'the check is 36 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      }
    ]);

    assert.isTrue(rules.at(1).match(terms.at(3)));
    assert.equal(rules.at(1).variable, 'total');
    assert.equal(rules.at(1).value, 36);

  });

  it('should match a type currency without text and store the value', function() {

    var message = 'the check is 36 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      }
    ]);

    assert.isTrue(rules.at(2).match(terms.at(4)));
    assert.equal(rules.at(2).variable, 'currency');
    assert.equal(rules.at(2).value, 'dollars');

  });



  it('should create a rule list', function() {

    var message = 'the check is 36 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      }
    ]);

    var cloned = rules.clone();

    assert.equal(rules.count(), 3);
    assert.equal(cloned.count(), 3);
    assert.equal(terms.count(), 13);

    assert.equal(rules.head().text, 'check');
    assert.equal(rules.head().type, 'noun');

    assert.equal(rules.at(0).text, 'check');
    assert.equal(rules.at(0).type, 'noun');

    assert.equal(rules.at(1).type, 'number');
    assert.equal(rules.at(1).variable, 'total');






    //assert.isArray(matchedRules)
    //assert.lengthOf(matchedRules, 3)



  });

  it('should parse a sentence', function() {

    var message = 'the check is 36 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);

    assert.equal(terms.count(), 13);

  });

  it('match a restaurant check sentence', function() {


    var message = 'the check is 36 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      }
    ]);

    var matchedRules = NplMatcher.matchRule(terms, rules);


    assert.equal(matchedRules[0].at(0).type, 'noun');
    assert.equal(matchedRules[0].at(0).distance, 1);

    assert.equal(matchedRules[0].at(1).type, 'number');
    assert.equal(matchedRules[0].at(1).value, 36);
    assert.equal(matchedRules[0].at(1).distance, 1);

    assert.equal(matchedRules[0].at(2).type, 'currency');
    assert.equal(matchedRules[0].at(2).value, 'dollars');
    assert.equal(matchedRules[0].at(2).distance, 0);


    /*_(matchedRules).each(function(rules, idx) {
      console.log('');
      console.log('Rule #' + (idx + 1));
      console.log(rules.toJSON());
    });*/

  });

  it('match a restaurant check sentence also with tip', function() {


    var message = 'the check is 36.6 dollars we want to leave a tip of 5 $';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'check',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency',
        variable: 'currency'
      },
      {
        text: 'tip',
        type: 'noun'
      },
      {
        type: 'number',
        variable: 'total'
      },
      {
        type: 'currency'
      }
    ]);



    var matchedRules = NplMatcher.matchRule(terms, rules);

    /*_(matchedRules).each(function(rules, idx) {
      console.log('');
      console.log('Rule #' + (idx + 1));
      console.log(rules.toJSON());
    });*/

    assert.equal(rules.count(), 6);

    assert.equal(matchedRules[0].at(0).type, 'noun');
    assert.equal(matchedRules[0].at(0).distance, 1);

    assert.equal(matchedRules[0].at(1).type, 'number');
    assert.equal(matchedRules[0].at(1).value, 36.6);
    assert.equal(matchedRules[0].at(1).distance, 1);

    assert.equal(matchedRules[0].at(2).type, 'currency');
    assert.equal(matchedRules[0].at(2).value, 'dollars');
    assert.equal(matchedRules[0].at(2).distance, 0);

    assert.equal(matchedRules[0].at(3).type, 'noun');
    assert.equal(matchedRules[0].at(3).distance, 4);

    assert.equal(matchedRules[0].at(4).type, 'number');
    assert.equal(matchedRules[0].at(4).value, 5);
    assert.equal(matchedRules[0].at(4).distance, 1);

    assert.equal(matchedRules[0].at(5).type, 'currency');
    assert.equal(matchedRules[0].at(5).value, '$');
    assert.equal(matchedRules[0].at(5).distance, 0);


  });


  it('should match two sets of rules with adjective car and color', function() {

    var message = 'the vehicle is a car blue';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        type: 'noun'
      },
      {
        type: 'adjective',
        variable: 'color'
      }
    ]);

    var matchedRules = NplMatcher.matchRule(terms, rules);

    /*assert.equal(matchedRules[0].at(0).type, 'noun');
    assert.equal(matchedRules[0].at(0).distance, 1);

    assert.equal(matchedRules[0].at(1).type, 'number');
    assert.equal(matchedRules[0].at(1).value, 36);
    assert.equal(matchedRules[0].at(1).distance, 1);

    assert.equal(matchedRules[0].at(2).type, 'currency');
    assert.equal(matchedRules[0].at(2).value, 'dollars');
    assert.equal(matchedRules[0].at(2).distance, 0);*/


    /*_(matchedRules).each(function(rules, idx) {
     console.log('');
     console.log('Rule #' + (idx + 1));
     console.log(rules.toJSON());
     });*/

  });


  it('should match a sentence with an email', function() {

    var message = 'my email is guido.bellomo@gmail.com';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'email',
        type: 'noun'
      },
      {
        type: 'email',
        variable: 'myemail'
      }
    ]);

    var matchedRules = NplMatcher.matchRule(terms, rules);

    assert.equal(matchedRules[0].count(), 2);

    assert.equal(matchedRules[0].at(0).type, 'noun');
    assert.equal(matchedRules[0].at(0).text, 'email');
    assert.equal(matchedRules[0].at(0).distance, 1);

    assert.equal(matchedRules[0].at(1).type, 'email');
    assert.equal(matchedRules[0].at(1).value, 'guido.bellomo@gmail.com');
    assert.equal(matchedRules[0].at(1).distance, 1);

    /*_(matchedRules).each(function(rules, idx) {
      console.log('');
      console.log('Rule #' + (idx + 1));
      console.log(rules.toJSON());
    });*/

  });


  it('should match a sentence with a date', function() {

    var message = 'I will call Jack on 10th January';
    var terms = NplMatcher.parseSentence(message);
    var rules = new NplMatcher.MatchRules([
      {
        text: 'call',
        type: 'verb'
      },
      {
        type: 'person',
        variable: 'who'
      },
      {
        type: 'date',
        variable: 'when'
      }
    ]);
    var matchedRules = NplMatcher.matchRule(terms, rules);

    /*matchedRules.forEach(function(rules, idx) {
      console.log('');
      console.log('Rule #' + (idx + 1));
      console.log(rules.toJSON());
    });*/

    assert.equal(matchedRules[0].count(), 3);

    assert.equal(matchedRules[0].at(0).type, 'verb');
    assert.equal(matchedRules[0].at(0).text, 'call');
    assert.equal(matchedRules[0].at(0).distance, 1);

    assert.equal(matchedRules[0].at(1).type, 'person');
    assert.equal(matchedRules[0].at(1).value, 'Jack');
    assert.equal(matchedRules[0].at(1).variable, 'who');
    assert.equal(matchedRules[0].at(1).distance, 0);

    assert.equal(matchedRules[0].at(2).type, 'date');
    assert.equal(matchedRules[0].at(2).value.date(), 10);
    assert.equal(matchedRules[0].at(2).value.month(), 0);
    assert.equal(matchedRules[0].at(2).distance, 1);

  });

});
