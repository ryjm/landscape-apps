/-  reel, groups
/+  default-agent, verb, dbug
::
|%
++  dev-mode  |
++  enabled-groups  (set cord)
++  outstanding-pokes  (set (pair ship cord))
++  bite-subscribe
  |=  =bowl:gall
  [%pass /bite-wire %agent [our.bowl %reel] %watch /bites]
+$  card  card:agent:gall
+$  versioned-state
  $%  state-1
      state-0
  ==
+$  state-1  [%1 =enabled-groups =outstanding-pokes]
+$  state-0  [%0 =enabled-groups]
--
::
=|  state-1
=*  state  -
%-  agent:dbug
%+  verb  |
^-  agent:gall
|_  =bowl:gall
+*  this  .
    def   ~(. (default-agent this %.n) bowl)
::
++  on-init
  :_  this
  ~[(bite-subscribe bowl)]
++  on-poke
  |=  [=mark =vase]
  ^-  (quip card _this)
  ?+  mark  (on-poke:def mark vase)
    %leave  :_  this  ~[[%pass /bite-wire %agent [our.bowl %reel] %leave ~]]
      %watch  
    :_  this  
    ?:  (~(has by wex.bowl) [/bite-wire our.bowl %reel])  ~
    ~[(bite-subscribe bowl)]
    ::
      %grouper-enable
    =+  !<(name=cord vase)
    `this(enabled-groups (~(put in enabled-groups) name))
      %grouper-disable
    =+  !<(name=cord vase)
    `this(enabled-groups (~(del in enabled-groups) name))
      %grouper-ask-enabled
    =+  !<(name=cord vase)
    =/  enabled  (~(has in enabled-groups) name)
    :_  this
    ~[[%pass [%ask name ~] %agent [src.bowl %grouper] %poke %grouper-answer-enabled !>([name enabled])]]
      %grouper-answer-enabled
    =/  [name=cord enabled=?]  !<([cord ?] vase)
    :_  this
    ~[[%give %fact ~[[%group-enabled (scot %p src.bowl) name ~]] %json !>(b+enabled)]]
  ==
::
++  on-watch
  |=  =path
  ^-  (quip card _this)
  ?>  =(our.bowl src.bowl)
  ?+  path  (on-watch:def path)
      [%group-enabled @ @ ~]
    =/  target=ship  (slav %p i.t.path)
    =/  group=cord  i.t.t.path
    ?:  (~(has in outstanding-pokes) [target group])  `this
    :_  this(outstanding-pokes (~(put in outstanding-pokes) [target group]))
    ~[[%pass path %agent [target %grouper] %poke %grouper-ask-enabled !>(group)]]
  ==
::
++  on-agent
  |=  [=wire =sign:agent:gall]
  ^-  (quip card _this)
  ?:  ?=([%group-enabled @ @ ~] wire)
    ?+  -.sign  (on-agent:def wire sign)
        %poke-ack
      `this(outstanding-pokes (~(del in outstanding-pokes) [src.bowl i.t.t.wire]))
    ==
  ?-  -.sign
      %poke-ack   `this
      %watch-ack  `this
      %kick       
    :_  this
    ~[(bite-subscribe bowl)]
    ::
      %fact
    =+  !<(=bite:reel q.cage.sign)
    ~?  dev-mode  [bite (~(has in enabled-groups) token.bite)]
    ?>  (~(has in enabled-groups) token.bite)
    ?>  ?=([%bite-1 *] bite)
    ~?  dev-mode  'inviting'
    =/  =invite:groups  [[our.bowl token.bite] joiner.bite]
    :_  this
    =/  our  (scot %p our.bowl)
    =/  =path  /[our]/groups/(scot %da now.bowl)/groups/[our]/[token.bite]/noun
    =+  .^(=group:groups %gx path)
    ~?  dev-mode  cordon.group
    ?+  -.cordon.group  ~
        %open
      ~?  dev-mode  ['inviting to public' joiner.bite]  
      ~[[%pass /invite %agent [our.bowl %groups] %poke %group-invite !>(invite)]]
    ::
        %shut
      ~?  dev-mode  ['inviting to private/secret' joiner.bite]
      =/  =action:groups  
        :-  [our.bowl token.bite]
        :-  now.bowl
        :-  %cordon
        [%shut [%add-ships %pending (~(gas in *(set ship)) ~[joiner.bite])]]
      ~[[%pass /invite %agent [our.bowl %groups] %poke %group-action !>(action)]]
    ==
  ==
::
++  on-fail
  |=  [=term =tang]
  (mean ':sub +on-fail' term tang)
::
++  on-leave
  |=  =path
  `this
::
++  on-save  !>(state)
++  on-load
  |=  old-state=vase
  ^-  (quip card _this)
  =/  old  !<(versioned-state old-state)
  ?-  -.old
      %1
    :_  this(state old)
    ?:  (~(has by wex.bowl) [/bite-wire our.bowl %reel])  ~
    ~[(bite-subscribe bowl)]
      %0
    `this(state *state-1)
  ==
++  on-arvo   on-arvo:def
++  on-peek
  |=  =path
  ^-  (unit (unit cage))
  ?+  path  [~ ~]
      [%x %enabled @ ~]
    ``json+!>([%b (~(has in enabled-groups) i.t.t.path)])
  ==
::
--
