/-  c=contacts
/+  res=resource
|%
++  enjs
  =,  enjs:format
  |%
  ::  XX shadowed for compat/parsing
  ::  remove for performance? (and in groups?)
  ::
  ++  ship
    |=(her=@p s+(scot %p her))
  ::
  ++  action
    |=  a=action:c
    ^-  json
    %+  frond  -.a
    ?-  -.a
      %drop  ~
      %edit  a+(turn p.a field)
      %heed  (ship ship.a)
      %snub  (ship ship.a)
    ==
  ::
  ++  contact
    |=  c=contact:c
    ^-  json
    %-  pairs
    :~  nickname+s+nickname.c
        bio+s+bio.c
        status+s+status.c
        color+s+(rsh 3^2 (scot %ux color.c))  :: XX confirm
        avatar+?~(avatar.c ~ s+u.avatar.c)
        cover+?~(cover.c ~ s+u.cover.c)
    ::
        =-  groups+a+-
        %-  ~(rep in groups.c)
        |=([r=resource:res j=(list json)] [s+(enjs-path:res r) j])
    ::
        last-updated+(time last-updated.c)
    ==
  ::
  ++  field
    |=  f=field:c
    ^-  json
    %+  frond  -.f
    ?-  -.f
      %nickname   s+nickname.f
      %bio        s+bio.f
      %status     s+status.f
      %color      s+(rsh 3^2 (scot %ux color.f))  :: XX confirm
      %avatar     ?~(avatar.f ~ s+u.avatar.f)
      %cover      ?~(cover.f ~ s+u.cover.f)
      %add-group  s+(enjs-path:res resource.f)
      %del-group  s+(enjs-path:res resource.f)
    ==
  ::
  ++  rolodex
    |=  r=rolodex:c
    ^-  json
    %-  pairs
    %-  ~(rep by r)
    |=  [[who=@p c=contact:c] j=(list [@t json])]
    [[(scot %p who) (contact c)] j]
  ::
  ++  update
    |=  u=update:c
    ^-  json
    %+  frond  -.u
    ?-  -.u
      %set  (contact c.u)
      %del  (time wen.u)
    ==
  ::
  ++  log
    |=  l=log:c
    ^-  json
    %-  pairs
    :~  who+(ship p.l)
        con+?~(q.l ~ (contact u.q.l))
    ==
  --
::
++  dejs
  =,  dejs:format
  |%
  ++  action
    ^-  $-(json action:c)
    %-  of
    :~  drop+ul
        edit+(ar field)
        heed+(se %p)
        snub+(se %p)
    ==
  ::
  ++  contact
    ^-  $-(json contact:c)
    %-  ot
    :~  nickname+so
        bio+so
        status+so
        color+nu
        avatar+(mu so)
        cover+(mu so)
        groups+(as dejs:res)
        last-updated+di
    ==
  ::
  ++  field
    ^-  $-(json field:c)
    %-  of
    :~  nickname+so
        bio+so
        status+so
        color+nu
        avatar+(mu so)
        cover+(mu so)
        add-group+dejs:res
        del-group+dejs:res
    ==
  ::
  ++  update
    ^-  $-(json update:c)
    %-  of
    :~  set+contact
        del+di
    ==
  --
--
