import { useState, useMemo, useEffect } from "react";
import ChatAssistant from "./ChatAssistant.jsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line } from "recharts";
import { LayoutDashboard, Radar, Brain, FileBarChart, LogOut, Bell, Download, FileText, Eye, Plus, Pencil, Trash2, Lock, Play, RotateCcw, X, Search } from "lucide-react";
import { readSessionToken, signOutGovernment } from "./auth.jsx";

const LOGO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCACPAZ4DASIAAhEBAxEB/8QAHQAAAgIDAQEBAAAAAAAAAAAAAAECCAYHCQUEA//EAFMQAAECBQIEBAMCCAoFCQkAAAECAwAEBQYRByEIEjFBCRNRYRQicTKBFSNCUpGhsdEWJENyhZKUs8PSFxlidIIYJzM3U1RkhMFGY3ODlaKy4fD/xAAbAQEAAgMBAQAAAAAAAAAAAAAAAQUDBAYHAv/EADwRAAEDAwEFBQUGBQQDAAAAAAEAAgMEBREhBhIxQVETYXGhsRQigZHBFjJCUnLRFSNi8PEHJDOSNYLh/9oADAMBAAIRAxEAPwDppjsIZiOTBkmKdZ8JjOSTCwYfbMHQ4gpRg4xDG22IRUIWTBQpD6xE4zBkxIQTgl7YgwPSDpsIN+kFKMe+0Gw2xATvgQYMMKAgnuIWM7wwIYGNoKUgMbw9hvCB3xAVdsQUaoJxtAcwsmAZ+sECMA9YYAg26wunfeClPYQ89+0RyYMmCjCZPp3g7QDEGNoKUYziH98LIPWFkwUYTJ94M7ZEKGNx1gpwjHrBt1gz2ztATBEDrDhc0KCgBHeGMHrCG5h567wUo6HYGDAgzjpCzBQmcCDtsYUHtBThMD1h4A3hZx1g5oKE9zAcd4iTmCCAJmAgwDIgz7wUoxg9IYEImET7wUaqXvEevSAesPG+YIEcpgwPSAnELMFKeAd4eQBEcwEGCjCAN4ZGD7QD0zDzBMpbE+0Bx6wE+kAHrBSlHg1i/wCxbef+Er15UWnv/wDZTM822v8Aqk5jVPF/rLUNJNN22bemPJrdfeVKSzo6stgZccHuAQAfUxU23OHpM5p8NadYbxq9Ppk+Q42mUk1zk2tKicOuEn5En1P6Y6G3WZlRCKipfutJwMDJJ7lz1xvMlNMaemZvOAycnAAV+Rq7pUdxqLbp/pFr98P/AEvaWZ/6xLe/+oNfvjnyxQuFdJGdUbxI96Mn98fe1b/CwsbanXcfrR0xbjZmlP4n/wDVUjtqKtvBsf8A3V+kasaXufZ1Bt4/0g1++JjVHTbtftAP9IN/vig38HuGFB/F6l3af6IT++MtsTSHRy/p1Mhat13lObnneNHShloDqVuEhKR9TEP2doohvSPeB+lQzaivlduRRxk/rVyjqnpsk735Qf7e3++GNVNNT0vyhf25v98aNqHC5oqmyHPgr3ZYn2nPLNZmJ1BaDoO6VICgnp2zmMFe0w4brMaCrp1Wma5MjqxSUAhR+qebH9aMEFnttQD2b3kg4xurLU3+7UpHaxxgYzkvVrv9J2nPUXzRP7a3++PRpl221WnA3SK3Jzij08hwL/ZFRpfVzQC0EhFm6TOVJ5H2X6o4Ovr83NHsy3EVqxXUCWsixZaTaVsgSdOW6QPbbH6oyP2VleMxAtHV5A8uK1m7bwxHE7g49GBzvM4Ctt067R5lSua2qOlSqtX6fKcvUPTCUn9BOYrFOUHiPuxn4i5q85R5RwZImZ1EsnH81Jz+qPjpGgrVUcdmKpqLJzXkDmfMpl7k/nOE4ETDsxTM1qakf+oJWCo23rZDu0dGfF5DfLit8TWvemjVQZpcnWHJ6YfdSygSzClJ5lEAfMcDvGwxt7ZilKLdp1tax0a2qc67MNNzktzKdIJKiQo9Iuuo82+I0No7VS2vsRTEnfGdVZbHX+tvvtBrWtBY7ADfPXmonYwQ8ZMPHrHMrtlHrDAxAfYQ8wUZQe0RJMShAesFKQ32gwYY+m0PMFGUsDvB0Jg2PUQsZ6QUp7dBCwTDA7wE9YIgD1gx64hwiYInsIRzABDwIIo4gwc4h43h746QUZSG5gx3h5AhE52gpSzABBgwx023giQB9IMHPSJZgJxBQjMRMBOYYHeClLrABvEsQDaCJHaDJhnHWFBEiT0MGMwx7/ph4gmUse0HTpDzmEesQUSggA94kRkbYiUS27wHPUQYIg377QRUh8SJa0TFi75SfjMjt/JxjOrWrNd0o1Ktx6ncs3SJm06axUKU8cy82wWzzIKTsDgnBjJfEkI86xff4z/DjSvFy4tq/bdRn/2Wpv8Adx6VZYmTUtPHIMgh/qvOr1I+KonfGcEFvovq1T0vt6ft9Or+jripy1ZpX8fp4OX6M8f5NY68meh+naNY0KlVau1CXpVEp8xPTkyoIaYYQVKWfYCM04Ybjuaman0uhUNDk3T668mTq0gpvzWZiVVssrT0+UZPN2xFt9VqbpjpbYFVuXQykyAqJcRKVOdojqJh+Sl1Z5jnmV5WcYziLY3CS3yCjPvE/dPT9R/vKoTborhE6sHuhv3h1/T1+i0JJWTpjo/LNzurc8m4LkKeZFs0975GD2+JdGw/miPCvHXG77skvwBTixb1uoHKzSKUjyGEo9FYwV/8UYXLT1IqtRDVKtGdqk9NuZHmzC3XXlk/mpG5MWC0+4WtWriQzN1G16BbEo4kKBngp18D/wCGDt95EbcrqOhPbXCQF3f9B/lU8ft9eOxtkJDe7n4n+wsRk/NPDM4r5iTdn1z+IEa+lTM7HyVnf80xedHDHPnTZVh/w4abfVUvwh8U3TUhI+Tl5OTm+/OY1FdHCFrDTHkG37gp9YYUoJJCvIcQM9SkjGPoY1LZtDbgXs7QDLiRnTRZ7zszd5BG9sJOGAHXOCsh0Drlk3lS3LckLBoEjekpLlyUnZiQDrT/ACjqrO6Vffj9kYfd+ses1Oq05b9SuD8GvyjhZcZkW0NJQR2BT++PeuOvW/w4W65ZdpTjdSvafaxVKnsfhQR9hJ7Eb4H3mMa4ebOkL9u2aq17tuP0WSbU7MzEw6UNrfJ+VK1kjJ3JxmJpmU8fbXGZmYvwh2pJ7s8AeQWrcDVTintFNJuzjR5bo0DHBxA1I5kL4rPoN0amVR2arFbmUU6THm1CpzryloZR1O5O6j2EZDVtQqfNTtNsayZZUnbsvONJWf5SecCwC44e4PYRPXq76DKVFGn2nszKM27KIDj7UkcocfJyeZWTz4+sYDYzImbspDO5Bm2yfuOf/SLinhFdF7ZM3DcHdb07z3+i5StnNsn/AIfTv3n5Ae/rrwB/L16raVGDda4kJMDBDU6D/Ub/AP1FvTjGYp7ouhVV4in5nYpacm3P0AiLhq9o8521O7VRR9GBew/6atzQzy/mkd5YSz7wsmACHjBjjCvSFGDeADeJY94Io49oe2N4ZiP1giedoRPtABnvDABgiUMfWHj0ML7oIjptmETDxk7QoIjJ9YIkR6wsekMIgZz0MM+sHaI598wRGTBkwbQ/aCJQ8YwcQ8CEc4iSMIhUL6Qz6wYiAESye0ES5cQAYicIogZiX1MLfpAMxHFEE+kKJcoPaIkY7wxhEbw8bdYMHpAdjBRlGfaDMLrBjsYKUZhgEwcsPIEESJGe0GYUEFGE9z2gIgAOOvWGTBSqM+JY55T9hE9CZz/DjUXFe23UtTbSkA6lszNtUprmP5PMjGf1xtnxMlJ8ywQTuTO/4Uebe9n0x3V2R1Nuxnntyw7HptVfSr7MxM+WQwz75Xg49o9HtEwp6SnkPIO9VwN3pzUzzsbzLfRYLcqZbh3sqdpVqBw3Fc/8Veqj3yvSsqEjnQ0MfLzHqeuI1zo5e172pfUg5ZSVTk9UXRKOSC087U8hZwW3E9CD69usRbvuravuVyn3O8H6tOzDlTpyyMci/wAplPoOXoPaLHeHjpTK1ar1jVGsS2VUdf4PkULR9l4jLi9+4GB95i9uMsNDRSVErdSOHU8guWtUM9bWtpA4+6eP9PHKtPpToVp/p3MTFzUm1peSrFVw8/lfmiVUoAqaZJ+ygHPSNnHBPbMLlCd4xTU3Uig6WWhO3hcJcMvKgBLbacqdcOyUD0JPc9I8kfJPcJgHEucdAvXGRwW+EloDWjU8vFZZjAzGhtftdpm3aTULd05nZabrsuAJ0tqC1yjZG5SO6v2RpS6uPGt1qynKZQ6B+Cq5NOOIcmkuczbLGflKO/Pg4z2jXWi1pVi4arNakXBW10i26You1OqPnPxBO5YQD/0i1dPbMdjaNmfZHGquWgbwbxyf75Lhr9tO6rj9ktJy53F3DA+neV9OnFjTeoM3OXRdFTVT6BIqL1SqkwftHqUIJ+2s+gj69RdTZS4GWbSs6UNKtWmqxKyyNlzCh/LPH8pR9+kflq1fZvuQl/4FI+BtKmqKW6W0kILa87vOAfaKvXtHgaXad3HqdcTVFojSkMJ/GTk4sfipZrupR/YO8d4wAf7yt0DRo3k0d/U/4XmEmX/7G36uccOdzcenc314letp5p7cuoVUVJUOVUWZdPmzMyoHkZQPU+voIyu0rdnrW1Bp7dQR5kslTjjUwgZQsBJ/QfaPcvLWqkaWppth6PqQmRpkyFVOoAAqqDyCOZOR1Sdx6RG9buatGryVySDRmrUu6VM/KJG6pR9Qw62lXssn5fQxjjuFTO/D27rHg7uePx6ZGoXxUWOkgjD4n70kZG90+HUA6Er2eFZ1FR1irE6DnklZhf8AWcEXBJzFPuCeUMzeNyVJJyEyaEj1+Zwn/wBIuFjaPOds3l90cOjWjyXrv+nkXZWVp/M5x81iup2olB0nsqo37c6JlVMpiUrfEs3zuYUoJGE5GdzFfB4kvDzjJauYf0cn/PGacciijhivPl6+Qz/epjlZo9p4dWNSaFp7+FRTVVqYLAmi15gb+Uqzy5GenqImx2mkrKV09RnQ8jy0Kt7rcqilqGxQ41C6PteJLw7uOBBRcjaScc6qcCB77Lje+mWsmm2r9J/C9gXRK1NtABdZSeV9n2W2fmT+iKG6h+Ghc1p2lVLkt/UmUqz1LlnJpUo7T1MF1KAVKCVc6sHAOMiK7cOepdX0r1dt65KXOOtNLnWZadZSohL7DiglSFDvsc/URsGyW+ugdJQPJLevosAutZSTNZWNwCu12M9YeBGM6halWdpfaT963rV2pCmMICuZW63VEZCEJG6lHsBFLrr8UuTan1s2PpauZlEH5Zioz3lrX/8ALQk4/rRzdHaqquz2DM45q8qbhT0v/K7CvvgHaDYdIphpP4lVjXTU2KNqRaz1ruTLgbRPMzHxEsCdgV5CVIHvvFxmKhITMgmrS04y5JONecmYSsFst4zzA9MY7xiq7fUULg2dpGV901ZDVtLonZwvozvBjeKZaueJPY9o1iaoOndqvXK7JuqZdnXpn4eWKknB5MJUpYz32EYnaXikJeqTbF66XpYkVnC5inTxWtsevlrSAr+sI3mbP174+0DNPhlarrxRtfub6v0R6R5Nz3XbVlUd+4LsrcpSqfLJ5nZiadCEj236n2G8fFZWoVp6gWbKX5a1Xam6PNsl8PdOQAZUlY/JUnuD0jk1xZ8RVwa66iTrLc841bNJfXLUuTQo8ikpOPOUO6lEZ36DAharPJcJzG73Q3j+yV9zZRxB7dSeH7q6lz+JRoTRZtcrRafXq4ltZT5zMulptWO4Kzkj7o+6zPEX0EuedZkKumr2+t5YQl2cYCmUk/nLQTyj3IxFX9E/Dt1E1Lt2Uu27ril7Vp8+0HpVhcsX5lxsj5VKTzJCARuMknfoI8DiG4GNQ9EKK5d9OqzNz0BggTL8uwpp6WB/KW2Sr5fcH6iL8W6yOf7MHnf8efoqc111Y3tywbvHhy9V1Yo9ZpNwU5mr0OpS0/IzKQtmYlnQ42tJ7hQ2MfYQBvHLXgP4japppfsnpxX55162bjfTLttuOEpk5lWyFpz0So7Ee4MXD42OIZ7Q7TQSluPhFzXGpUrT1gjMu2B+MewepAIA9z7RRVdkmp6wUrdd7ge7/wCK3prtFNSmodpu8Qsn1a4r9E9GZlVNum6EzFUT1p9PR8Q+n+cBsj/iIjTzXicaKrnPJdta5m5fOPO8ps7evLzRz+0y0v1B15vsW7azDlQqs6pUzNTUw4eRpOcqddWc7ZP1PSLS1Dwt79RRfiKfqZRpmppRzfCrknG21K/NDnMT95TF6602mgxFVv8Af8VUNuVyqyZKZnuq5mkPEvpBrcFM2Pc6FzyBlchNJ8iZHuEK+0PdOY2lnH3xxGesDWjSO+FNyduV2nV6hTWETEpLuK5XEnZSVpGFJPtsQY6q6ba3VWt8Np1duKgPNVik0x52fkXgWC4+wDzYyMpCsA5wesVN3szKQtfTO3mu048CVZW26OqQWTtw4ei3HyjrDEUbsfxMG7wvOj2xN6WM0uVqM0hh+dcrXMmXQTusjyQCAN+ojK2fEIte49YKLpjYFoPVSRqVSRT3axMTHlI3OOdpsJJUPQkiNN9kro3bpZyytll0pZBlr+eFXrje4g9ZaXrnVLRpV2Va36VRfKTJMST6pcPJKAouqKcc+SSN9touhwc6g3rqVoRRblvzzHakVuy4mnE8qpppCylDh23JHfvjMaA4uOI/Su19W5izL34eKPeM3R2mVNVGanQ0vC083LjylbDPqYtFw66jSGqOj9GvWn2xL23JPJcaapzLoW3LobUUgBQSkYwM9BFlcci2xfyd3hrpr/laNCR7dJ/Nzx010Wy+kQcX5LTjuB8iSrf2ioetniMWDp3XZq1rFt5d2T8k4WpiZEyGZRCx9oJUEqKyD6AD3jHNNfEut26aumhai2V+AGJz8U3UJWaL7Tajt+MQUghPuCfpFdHZK58faiPT4Z+S3H3alY/sy/VY5W/E4u2m3DO0VjS6kuJlJxyWCzPuAqCVlOccvtF+qTOqqVKk6i4gIVMy7bxSDkJKkg4/XHCm6H2Xb2qr8s4lxtypvLQtJyFJLpIIMdzLXz/Bqkf7ix/diLPaK309FHEYW4J4+S07NWTVT5BK7OOC9Qq9IWc9YMQx0zHKK/wjr0g367QZ6woIpZhEjuIUGIJwTH64eIIiSTBRqpZx2hHfpAOmd4efeClUS8S+Smp+raa02TAL05MTTDYJwOdSmgMn6mPY4mbQ1OvvTW3bI0ztQziy1LivOtPtoU55DQS0k8xGUgkn7ox3xRJuYlJnTp6VcU262udWhaTgpUC0QRGu71q9e1Z0HmZiXrc2bqsJbdRmQy6UOTVOeQEqVhOObkUBn2j0e2Uzn26CoH4Tz4DJK4W5SltfJDycNepwFiFL4UOJSlTsvU5LT6abflnA42oTTOxH/HHSPh4tWatPS6mSlSoX4IqUyXJmelvlyl9SjzEkEg52jjhL3lcwwBctUA/3tz98dOeHzVuT0o4TKReOqzk1JfDl5MqiYJL88Cslvy0k5PNn9G/SPraaKrmpmxOcDlw0A19V8WJlJDVOmaCMNOp4Y+S3bqxq1auj1pzF1XTNpQlAKZeXB/GTLuNkJHf39IoQzxgXPct7VCavyVRU7OrI+GmqGd22Zfspv/bHXPeMH1x1TrHEVUzebEy62qnoLYovPkS7Wfto/OJ/KOMw9HNJZCpUh7VPU+cXSLHpavmJ2eqbw6S7AO5z0Kh03jNbrFBaqXtKsZe716DvVdX32e71PZ0h3WNPP1Pdhb6qHBpQaM2/qLO3iv8AgMyz+EywiXUZz4Yp5w3npnBAzGkdUNXZm9XJa36DJii2lSfkp1KaOEgf9o5+c4epPvGZf8tu6ZutGjz9vyC9P1J+CNALKSoSfLyhPm45ioAZ64zH6T/DO/fVapVe0SnEVW0a+vm891YCqUeq23xnI5R09envG3RvlppN+6n9J5DuP9S0K+GOqj3LU3j94cz3j+n+ysX0Ls+79QbwaolqMFSFAfHOrBLTTJ6lf68DuYvpN6R02xtGbgs2wpBXxs3T3k+YghLsw+U9Sr9Q9BGttKNUtAdGLlY0SoE0lx8gInq6eUtPzucFClenYHoOkbD4p71TZGiNenmX1ImKg2mRlVIVg87hAyCPRIUfuigvFzrrhWRQNaWxkgtyOOvE/sruy2e32yjmqHODpACHYPDTgP3VQVcOesb9Gl2jZbyX0OKKkl9oEA/8Ub80S0aud/SutWNqXa7CfIcecoxmVpc8pbjZBI5ScYVgxTafuyuptuklVZnudanVEmYWSRn6xYKw75r2mejLSFVqbauK7XHJ6XDjhWpmSbTyhXzZ5eYnaOmu0FdNGyIPbvFwxgEeJ4n4rjbNNbqWSSZzHboDs5IIPLGMDnw1WYcFEjNUi5r5o0+hKZmQW1LO8pyOZK1g/si2JBiovAi65O1S856ZfW6+8Zdbi1HJUolZJJ+sW5Oe8cBtRvfxJ4edcD0C9M2ODRaY9wYGXY+ZWh+ORKjwxXmE9fIZ/vUxyq0i1Af0o1EomoTFMaqDtFfL6JdxZQlw8pTgkdOsdVeOR3y+GG8z/wC4Z/vUxzM4YrXoV8662ja9009uepdQnC3My7hIS4ny1HBwQeoEXuzbmNtspeMjJz8gta+h7q2MRnBwPVb21C8Sa/7ytOp2zR7GpVGXU5dcqubTMOOrbQsYUUg4GcE7xqThM0PuPWHVSjeTSHzQaVONzdTnVIIaQhtQVyc3QqJAGPePx4s9E3dD9Xqhb8jKLaoNQ/jtJXuR5KjujJ7pOR9MRejw+NaaJfWlqLAealJWv2skMuoaQlBmZcn5HsDqeyj6gHvGeqfFbraZ7ez3X8T0z1WCmZJW1whrX6tVbfEj1FqVb1clNPJafcFJtuSbV8OlXyGYcHMVEeoTyiPH4YbT4PnrSdr2vl4M/hyZeWhmmrdebRLtJOAo+WN1K69dhiPk8QyzZ62+IifrL4V8NcEoxOMKPQ8qQhQH0Kf1xlfCvoLwr6xWEmZvq65mm3VJOuInZZdVRLpUjPyOISoDIKcZx0IMZAYorVG4EgYGS0aqCHy3B4IBP9XBaO4i7c0doN/f8yV0Jq9uzrAeCQVqMq7kgtlSwCR0I69Yt1w2X3d9+cEt/WjT33ZqrW5KTMjIchJc8hTXMlA77AqAjW18Wp4fFiXHNWxM1S9qq/KEJdmKXMIfl+b80L5hkjviLEcO1Y0A0d0QufVzTumXebVVMhc78e0lyYcKMIKm0c2Ckc25z2Ma1yqN+kYAxxcCMFw4/wCQs9DCW1LiXtAIOQDwXNrTWo2ZRL7pNQ1HocxVqBKzINQkWlFC3Ub5Hbv2yM4Ii1t56YcIGvjlJf0W1Eo2ntQGW5mQqLLjSXs45cJUQkKBzuDvHpVqb4C+I+9mKPSpO4bOuGsuqCai2w3Kyy3SCfxiStSAVHvyjJPWNOcU3C1K8PC6VPUvUCTr0lV1rQ20QlE00UgHmUEkgpIPXbeN7txVzNBLo5MaDkfotTsTSxOOGvZ5/urg2RoZdnDTw36nSDl9y9ek56kzE5IGWaUgS6yypKyCSchQ5Tt6Rzo0do9NuLVS0KNWkpVJztZlGXwvopCnUgg/Xp98Xa8PO767qbYN/aL3NOPTtIlpFAlHHlFamETAcbU2CfyQUggfWKQXtadzaP6kT1u1BL0nVLen8suFOD8i8tuJ9QQAQYw2wPbNUU8jsvOueGdFkry10UE8bcMHL4ruc4uRo8hzuuNS0pKtgcxPKlCEj9QjG6vUbP1Asyu0yXnpSpyMxIvy80hJyOVSCDkRW6y+NHRnWfS8WveN3t2hcjkohmaE8CGVPJAytCxsUkjODgjMeTbNfotQte+rJ0j1ToVdvuo0dxqRlJd1SW1o3CvLWoAKc5c4A6HEc5DZ9yN753FsrXDAwcEZ45VjPd53VUcMDA6FzTk51BxwwucrM05SLhQ/IuqC5KeCmFpO+UOfKR+gRaHxGKrUKnftjCbKwEWsy8Afz3FZUfrsI1PoLorceo+tdJsGbo800qSnkuVdLiCkyrLa8uc+eh2x7kxbXxMNGJ2eoFuaqUKWcdlqAyaXPoQM+WwogtuH2BBBP+0I6qqqYWXGCNxycHXx4fNVNPBI6hmeBgZHlx+S+vwtKNTE2Vd9xBlBqDtSalFOY+YNJbCgPoSox93Ejx4Xpopq3VtPKRZVGqEtT0MrQ/MOuBxXO2FHIScd4rPwU8TtO0Au6ept2JfVbNfSlMytpPMqWeT9l3l7jBwcb4i6l2XLwIXy+/qBd1YsiqTk02lTr8w5mYWEpwAUfayBtjEUtwpxDcXy1URkY7hj4K0o5zLQtjgkDHDjlVx/1omoql5c0ytw565ee/fG7rI4ha1xG8Luqlw1qhSNIdpcrMySG5NalJUDLheTzd94o7xO3zpFeV6tMaKWbKUS3aa0WkvtMFpc64TkuEHcAdAD9Ytbw46e1qyOBq/6vWZd2XdueVnaiy2tJSQwGA2g49+Un6GNmvo6Onp45mR7ji5uOvHxWGjqqiWd8Tn7zQD4cFz2pdOqNTqUrSqWy4/NzbyJdhtv7S3FHlSB9SY6CaD+HfdlmXRa+od0XvIMTdKmmZ92msy6l4I38vzMgZ98RTjhtKXddrFQ6kKSa5KnB3/LEdvFAE5EfW0lznpN2GE4Dgcr5sdDFU70koyQdFyL8QFGeJu4SjOfh5T+6Eb9trUKsaZ+G+1WaQ8pqenlu01lxJwpHnPqSoj3CeaNA8frgRxNXDn/ALvKf3QjcE5b9Runw0pH8GsrcXS5wz60pGT5aJhYWfuCs/dH3MGOoqUP4Zb6LHEXCqqC3jh3qqqaFaT1DXPU+lafyU98KZ9SnZmZKeYtMoHMtWO5x09yIvHqR4bOnLNhTa7Aq1WauGQllOtLmng43NrSM8qk4+XONiOkU84S9VKPoxrdRbzuErFLKHZKcWhPMW23U8vPjvg4P0zHTHUni20QtKwZ255G/qPVnlyy/gpOSmkuvPuFPyp5Acp365AxHxe57hBVxtps7vdwznmvu1Q0UlM8z43u9cd2Zd2VqQlptsodZe8taT2UFYI/THeC1wn+DVKx/wBxY/uxHCeYnF1euOVJ4Ydm5ovrA7KUvJ/bHdi2fltukj/wLH/4CNba/O5Dnv8Aos+zf3pMdy9PGO8I7HaETntAMmOHXWI3gxiJdoWemYIjAgP0zAT7wE+hgowUt87QAGJYg++CnKWMbwGA9IDv+iCKgHioLKXNPSOuZ7/Cit1pamu6W6rUa5Jlr4iluyTcnVZUjKZiTcTyuII77HI9wIsZ4qqlJc08I/8AHf4UYRp1onaMhTGNf9fHkyFm0qUaXJU5ez1WfSMpQEncpJxt3+keqWeeGKxYl1zwHMnJ0C4K6QSy3Zro+WueQ0Cyam8LOlOllYqmvOotdl5rTaU8uo23IIWFu1IuALbaUk7nlJxy98ZO0V21w15unW+7DWKqr4SlSYLNLpjRwzKM9gANiojGTHtaocRlQ4grldo9ytopdtcwZoUiyMJp2NkE4+0T3P6No/fTjR20rZfm711trTKLdoqUuop0osmYqjpPyMp2+VJx8x9I36Oilhj9tqvfeBgY/D3ePUquq6yKSb2OL3Qev4u/wHRehoZpxJyNNOtWp88/RbMpi8MhPyzFXfHRhlJ3Uk9CrpH76maszGv8wyzS2RRmqQlTdMoTRwwGs7cgGxcO2T3jXurus9x6wXCy9NS7chR5BIlaPRpRPLLybA2SlKR1URjKupi4vBZwgykgqS1S1Tk0pqBSmYpFIe2U0OzzqT39ARt16xjqKxtvZ7ZW6u5N6eHf1K+Bb3V7/ZqP3Rzd1x17ugWurR4FNWbmsmlXUt2TkJqpPpK5CaJQ4xKn+VWex6nk64xGZTuvVhcMyZXR/TCns3HLMvKF01B1ah8S4RyuIaI6EDO/QYx6xfspwOXAx6YihvG1w2W7bwf1Ysh+RkC8srqdMW6lHmKJ3dZBPXPVI+ojmbfdxeqgU9w+6c7oHDPf4cleV1oNop+3oPvjGSend481qjVfSik0+kNataTTztVs6or5lpzzTFMeO5aeHUAHooxjdza3X3e9mUaxbjqqpqnURxTkuVD51ZGEhZ/K5RkDPrHm6P6uV3SytrmZdKJ+jz6fIqlLmPmYm2TsQUnbmwTgxtK6dAqHfimL00Mq0qqhVXmW5Tptzlfpr23M0euRvtHYxfyZGx1QyB9130PQ+q4mow+N8tO7dzo5v1HUZ+S8uy7Hk7xqdHarLvw1BosiJ6rzJ2DbWebl/nK6ARO4L3Xf2oVQq0ogs06WkVylOlgMBmWbTyoSB22GT7mPKvG5002mNaU27NrUGFpTUpo/L8XMJ25cn8lPQCPCskzErXJuUmWVIcTJvBQV16RZsjD5e3d4Duz+65id7o6UwDxPerT+H8+VzN4IOMhEt+1cXHGSN4pl4fSR8deKs/kSu33ri5hO20eS7V/+Uk+Hova9kBi0RfH1WquKHT24tUNEbjsm0pZuYqtRbbSw246G0qIcSTlR2GwMUz4duCrXnTvWq1Lzui35Jil0qc86Zcbn21lKeRQ2SDk7kR0hG0GTGnSXeajp3UzAMO+qt6i2w1MzZn5yFobjD4fHNftNjT6G20m46Q78VTFrISHCRhbSlHoFD9YEVP0G4U+KzRLUyk33T7Yk1tSzobnpdFUaw/LK+2g7+m49wI6UQ+bG0TS3mopqZ1NoWnr3r5qLZDUTCfUOHTuWoeIjhztTiOtFmkV9S6bVZPLtPn20hS5ZZG6SPyknuPbaOf1yeHnxF29PuS9IpNPrMuFENzEpPIRzJzsSlZBH03jq8VHOIeSTE0F8qrezs4zlvQqKu009a4Pfoeq5jaX+G9qxXa3LualzElQKOlQU+GZgPzLg/NSE/KM+pO3pHQ2n6V2VTNN06UStIQm3BImnqlic8zRGDk91HJOfXeMshD3jHXXepuDgZToOAHqvukt0FGCGDJPVczdVfDa1OoFbfmtKp+TrtJWouMtPzAYmmRnZB5tlY9cj6Rh1K4A+J+4JxDVVocrJNghJfnqmhQQPUBJUTHWTmhZ94sGbUVrGbpwT1I1Wm+wUrnbwyB0WoOGXh1ofDtZTlEk5sT9XqTgmKnPcnL5qwMBKR1CE74+pPePJ4k+EmxeImUbn5x5VHuSUbKJapsIB5k9kOp250/rHaN6npADFQK+oFR7UHe/1Vn7HCYewLfd6LlBcnh1cRdFnHGaVS6TWZZKiG35aeSgrT2JSvBB9t4wa+uHbXvh6kKdqFXKK9SUtTaQzOSUyHFyzo3SpRRnlB7E7R2ZzHl3NbVDvGgz1s3JT2p6m1FlTEww4MhaCN/ofeL2LaqpBAlaC3npxHzVNJs9AQTGSDy7lRXhG4zaBV77eo+qlCotKrlwIZYFwyzAaVOvJGAJk9AT2Owz1i+Fco9IuijzVDrMkxP02oMll9h1IU262obgjvFcleHZw1FXOij1pBByOWqObRYa1belLSt+RtuRm5uYlqeyGWVzTpdd5BsApR3OPUxXXWejnkE1HkHmP2W9boamGMxVIB7/3VBNY/DLrbVSfq+jFel35N5wrFLqLnlrZB7Id3CgOwOD7xptPAFxNOTXwv8DJVIzjzFVFnk+uebP6o66H6whG3BtPXQx7hw7x4rXmsNJI/eGR4KhWgPhuvUery9za21OVmhLOBxujSS+dpZHTzXDjI/2Uj74uLqpa8zcOk1x2ZbciyJidpL0jJMAhCAoo5Up9AOkZgT3gzt1isqrpU1komldnHAcgt+noIKeMxxDGeJ5rmVoxwN8QNl6r2tdVctuRap9LqjMzMLRUG1FLaVZJAByY6bE59ojzH12iXMYXC5y3JzXygadEoqGOhBEZ4rntxZ8Het+rOt1Yvaz6FJTNKm2pdDTjk622olDYB+UnPWLScMuk1WsHQCmaaagUuX+JSiZZnZYOB1Cm3Fq2yNjkGNy5gzGSe7T1FOyndgBuMfBfENuhhmdM3OXfVc1tbfDgv6m3FM1PRx6Vq1FmVqcRJTL4amJbJzyAnZaR2OQYxawPDq1yuCry7V4Scnb1LC8zL65pDrvJ3CEIJyT7kCOqP3wxtG6zaauZHuHBPXmtR1hpHP39QOi5Oznh9cRkrWnxTLZknJFuZV5Di6k0FKaCvlJGeuMR1Rocs/J0SnycynldYlmm1gHICkoAP7I+8w8ARoXG7T3INE2Pd6LbordFQkmMnVRh9DiHCOO3WKtWCCfSFBgmHt6QyiWDBEsd4WR6QTKObfaET2O8A++GB6wRAEP37QukLJ9YIuf/AIqrzbatPObcgzxx6/8ARRUDWXXS8NZ5mmNVl74ak0WVblafTmlfimUoQElXuo4yTF1fFOs2r1G0bOvWUZK5Gkzj8pNkDPll5KShR9BlBH1Ijn5bMvSGVuVauPJMvKnKZYH53l9hj0j1XZiGOoooiQMtzr011XDXyR0E78c8adV6lrUCXprLd3XOtTEjLrDkuyNlzSxuAkeme8ZLU9ZXLqSmk1+hMmmqVgJZJ81B7KB9RGC3Bcc7cs2JiaIQ2j5WWEfYaT2AEWf0D0fs3S21U68aurp9RqCU89tWyZhtS33sZQ6+nPygHBwe2/oI6OqrhRsDYATngBxcVzsVvbWO7SqwMc+TR3d6zvRvhspWktmzPEJftvz1zuycumdoVvNSxLu+Ch59HUAdfYDMVuvfXzU2+b+mdQZy5p+QqK14l0SkwtpMq2CcNoAOwEezcOq3EDX9Sn9UBd/wFVWfLZRKzoDLDGcpYSj7JQPQg5jPW67pzrQryNabQlLariwMXLbi0J81fcvy5PKrPcp3ipZRVccrqiqj3yen4R0AW/JV0roxDTybuOumT1JWQSevury+E+YuZWoVZNWRdqZEThmT5oY8jm5ObrjO8V0rN23Jdc38fclen6pMK38yamFOH9ZjeUzZ1Np+ls7pLLXVKTFHNf8AwwisBojmbCOTHJnHTfr1jGJZFl2GR/Au2mbiqI3/AAlWXkhpB/2GUnH6Y3KS3Opt53Z/eJI05KnrbtHUYYx5OBg9Mhebp/pTUbnlV1Ssvu0mn5HkTDqMB49+XPX7oza3ddm9Kpg2zaNETNUyXd/jDk2SHZhYOFKGPs5A2jXddOo95zwqNcrDLy0HLaEzKUttD0QkbAfSPXZt96tSiBXTKsz0tgB9t5J89Por394svZzKzdeFz0kwZJvudkdBy/dbJvzSek3BJ/6cLJqbk1ak6ozFSYUczFNmScqaWB1BPRUYbSrzo03OPqqEqiXeSw43Lv53KcfZVHzWNrfc2mNyqVISzL9KwZWepDx5pebZOykrHTOOhj0tXLSsWYkJTUzS2rtfgOrulExSX3QJqmzPUt8vVTfXCo0IZ5KST2eXUHg76Hv6dVu1VBFXw+0M91wGo+o+o5Kw3h4THm1C8x2CJX9q4umd9op14d9sVGUot03VMtqTKTzzMqwoj7ZbBKiPpzARcYR5ftO8OukpHd6L1fZdhjtcYPf6pYPXpAdveDmhRz2V0Ked4ROfrDA9oMH0giB9YO8G47QEnpBEZ294M75hQYgowgnMAhkdzB90FKB6Q8xHJg3hkqMIMSBHrEQMw8EROVKeR2gO42hdBBuBEZROFzQt+kAzBEZzDx3IgAxvDzBEYBhZxCyYIJhMH1gzCwYMGCJg+sPML0BgJ9IIjMHNmF1gwYKMIO8MAEQY9QYAd4KUQAiEevWCCjCfN7QoeN4CIKUxjeFn9ELMEETyDtBjaEMDeJE4GYIvGvG0Lcv62p+0bspbVQpdRaLT7DicgjsR6EHcEdDFF7z8LJt+quv2LqYmVkHFEol6hJlxbY9OdKhn9EX/AMmCLGiutVb8indgHlxWpU0MFXjtRlc3v9VdfQ6ap0b+wuf5o+geF3qAoBLurNLUB0zKO7f/AHR0ZJz1h4MWA2ouI13x8gtQ2SjOhb5rnMnwt7576q0k/wDk3f8ANEv9V5foGE6qUn+xu/5o6L9NwIM+0T9qbl+fyC+f4FRH8PmufA8NvVL8HCkr1hp5lAdmTLO8v6OaII8Mq+Ej5tUaUf8Aybn+aOhRMLJzE/aq5fn8gsf2ct/5PNc+x4ad7o+xqdSs/wC6Of5omnw2b8Sf+s6lf2Vz/NHQIbgkwwAIfaq58A8fILGdmbcfweaoG34bd6g5XqVSSf8Ac3P3x71r+HNNMVNpy7dRW3pFCgpbMlKFK1gduZR2/RF3s74hZ3iH7T3Jw3d/yCgbMW0ODtzzK8i0bUoNi27J2tbMg3KU+RRyNNp/WSe5PUmPX/XC69BDGfujn3vdI4ucckq/YxsbQ1owAjG/TaEMdYln3iOY+VOqeR6Q9vSI5MEETz3EGRsYBvtBnG2NoKUeu0PqIjmDOIKE842gJGIWD1g7ZgpT5cmDONoAcYgJgiYyOg7Qub1gzvC39YImT2AhAb7iGMYgMERj0MH3wEwoKE/fMGfvhQxnHSClG3SDb/8AhBggbQs9CYImB6Awzt1ERyYN/WCjCMmADMPAAgz6wUp4x2g6RHO+YIKE8iFBD3O0FKCMYh4HpCxtBkDfrBQmekIGFmCCJgbQECGMwiYJlAxjpARt1gJ7djBgYgpSh8ph4xANhvBRlBHtCJI3gMBOSIJqgg4yTCh52wYOpzEBSliGB6wz1EIk5iUyggAQveHnPWDEES94YHcw8bwuaHFQUd9oPYwZxvCgpRjfaDESGMQQUZUcdzDAEPf1hEwTKN85zgQH07QdYOuNoKUoOsShZ227QRA6QbfZzBnO8LrBEyDjELHrEsAmDbpBQSlj3hbD3iR+sRz7wUp5HpASekG8G3cdIIlg5hgZMPoesB+sFGUsDvDPTaET2hfXpBSiCHgQ4JlLEMAQZhFXpBQnntiInP6IfXqYB02gpSxBiJQZxBRlGxwYR2OYCqFnPUwUoyYBDwDABviCjKMQwB6QE46RHO2IKV//2Q==";
const D = ["Hospitals", "Water Supply", "Emergency Services", "Telecom"];
const COL = { Hospitals: "#22d3ee", "Water Supply": "#3b82f6", "Emergency Services": "#a78bfa", Telecom: "#f5b942" };
const PR = ["Critical", "High", "Medium", "Low"];
const W = { Critical: 4, High: 3, Medium: 2, Low: 1 };
const ROLES = ["Super Admin", "Government Administrator", "Department Officer", "Viewer"];
const PERMS = { view: "View reports", export: "Export reports", users: "Manage users", prio: "Edit priorities", conf: "Configure simulation", run: "Run simulation", reset: "Reset scenarios", perms: "Edit permissions" };
const DEF_PERMS = {
  "Super Admin": Object.keys(PERMS),
  "Government Administrator": ["view", "export", "users", "prio", "conf", "run", "reset"],
  "Department Officer": ["view", "export", "run"],
  Viewer: ["view"],
};
const DEF_CFG = { supply: 70, demands: { Hospitals: 40, "Water Supply": 30, "Emergency Services": 25, Telecom: 20 }, priorities: { Hospitals: "Critical", "Water Supply": "High", "Emergency Services": "Critical", Telecom: "Medium" }, reserve: 5, guarantee: 20, severity: 3, type: "Cyclone" };
const TYPES = ["Cyclone", "Flood", "Earthquake", "Heatwave", "Industrial Fire", "Landslide"];
const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1);

function engine(c) {
  const m = 1 + (c.severity - 1) * 0.08, need = {}, a = {};
  D.forEach((d) => { need[d] = +(c.demands[d] * m).toFixed(1); a[d] = 0; });
  let pool = c.supply * (1 - c.reserve / 100);
  const g = D.reduce((s, d) => s + (need[d] * c.guarantee) / 100, 0), gs = g > pool ? pool / g : 1;
  D.forEach((d) => (a[d] = ((need[d] * c.guarantee) / 100) * gs));
  pool -= Math.min(g, pool);
  [4, 3, 2, 1].forEach((t) => {
    const ds = D.filter((d) => W[c.priorities[d]] === t), open = ds.map((d) => need[d] - a[d]), tot = open.reduce((s, x) => s + x, 0), give = Math.min(pool, tot);
    ds.forEach((d, i) => (a[d] += tot ? (give * open[i]) / tot : 0));
    pool -= give;
  });
  D.forEach((d) => (a[d] = Math.round(a[d] * 10) / 10));
  return { need, alloc: a };
}
const sum = (o) => D.reduce((s, d) => s + o[d], 0);
const mkSim = (id, c, ts, status, by) => { const r = engine(c); return { id, type: c.type, ts, cfg: c, need: r.need, alloc: r.alloc, status: status || (sum(r.need) > sum(r.alloc) + 0.05 ? "Partial" : "Completed"), by }; };
const SEED = () => [
  mkSim("SIM-2026-006", { ...DEF_CFG, type: "Cyclone" }, "2026-11-10T09:30", 0, "Anika Rao"),
  mkSim("SIM-2026-005", { ...DEF_CFG, type: "Flood", supply: 82, severity: 2 }, "2026-10-28T14:05", 0, "Anika Rao"),
  mkSim("SIM-2026-004", { ...DEF_CFG, type: "Heatwave", supply: 95, severity: 2, reserve: 8 }, "2026-10-15T11:40", 0, "Rahul Menon"),
  mkSim("SIM-2026-003", { ...DEF_CFG, type: "Earthquake", supply: 60, severity: 5 }, "2026-09-30T16:20", 0, "Rahul Menon"),
  mkSim("SIM-2026-002", { ...DEF_CFG, type: "Industrial Fire", supply: 110, severity: 1, reserve: 10 }, "2026-09-12T10:10", 0, "Anika Rao"),
  { ...mkSim("SIM-2026-001", { ...DEF_CFG, type: "Landslide", supply: 50, severity: 4 }, "2026-08-21T08:45", 0, "Anika Rao"), status: "Failed", alloc: { Hospitals: 0, "Water Supply": 0, "Emergency Services": 0, Telecom: 0 } },
];
const USERS = [
  { id: 1, name: "Anika Rao", email: "anika.rao@resqgrid.demo", role: "Super Admin", dept: "Control Room", active: true },
  { id: 2, name: "Rahul Menon", email: "rahul.menon@resqgrid.demo", role: "Government Administrator", dept: "Disaster Cell", active: true },
  { id: 3, name: "Dr. Meera Iyer", email: "meera.iyer@resqgrid.demo", role: "Department Officer", dept: "Hospitals", active: true },
  { id: 4, name: "Kiran Shetty", email: "kiran.shetty@resqgrid.demo", role: "Department Officer", dept: "Water Supply", active: false },
  { id: 5, name: "Sana Khan", email: "sana.khan@resqgrid.demo", role: "Viewer", dept: "Telecom", active: true },
];

/* ---------- export helpers ---------- */
const dl = (name, type, data) => { const u = URL.createObjectURL(new Blob([data], { type })); const a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 500); };
const csv = (rows) => rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
const ascii = (s) => String(s).replace(/[–—]/g, "-").replace(/[^\x20-\x7E]/g, "?").replace(/([\\()])/g, "\\$1");
function makePdf(title, sub, lines) {
  const pages = []; let cur = [], y = 735;
  const T = (x, yy, s, t, b) => `BT /F${b ? 2 : 1} ${s} Tf ${x} ${yy} Td (${ascii(t)}) Tj ET`;
  const head = () => ["0.03 0.07 0.12 rg 0 780 595 62 re f", "0.13 0.83 0.93 rg 0 776 595 4 re f", "1 1 1 rg", T(40, 808, 20, "ResQGrid", 1), "0.7 0.8 0.9 rg", T(150, 810, 10, "Administration & Reports", 0), "0.1 0.1 0.2 rg", T(40, 752, 15, title, 1), "0.35 0.4 0.5 rg", T(40, 737, 9, sub, 0)];
  cur = head(); y = 712;
  lines.forEach(([cols, b, s = 10, gap = 16]) => {
    if (y < 70) { pages.push(cur); cur = []; y = 790; }
    cur.push(b === 2 ? "0.03 0.2 0.4 rg" : "0.1 0.1 0.2 rg");
    cols.forEach(([x, t]) => cur.push(T(x, y, s, t, b)));
    y -= gap;
  });
  cur.push("0.4 0.45 0.55 rg", T(40, 36, 8, "Simulated data generated by ResQGrid. Not connected to any government or utility system.", 0));
  pages.push(cur);
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${pages.map((_, i) => `${5 + i * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"];
  pages.forEach((p, i) => { const s = p.join("\n"); objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`, `<< /Length ${s.length} >>\nstream\n${s}\nendstream`); });
  let out = "%PDF-1.4\n"; const off = [];
  objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${off.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return out;
}
const simPdf = (s) => {
  const L = [[[[40, "Disaster type: " + s.type], [250, "Date: " + s.ts.replace("T", " ")], [430, "Status: " + s.status]], 0, 10, 16], [[[40, `Total available: ${f1(s.cfg.supply)} MW`], [250, `Total demand: ${f1(sum(s.need))} MW`], [430, `Allocated: ${f1(sum(s.alloc))} MW`]], 0, 10, 28],
    [[[40, "Department"], [190, "Priority"], [270, "Required MW"], [370, "Allocated MW"], [480, "Met %"]], 2, 10, 18]];
  D.forEach((d) => L.push([[[40, d], [190, s.cfg.priorities[d]], [270, f1(s.need[d])], [370, f1(s.alloc[d])], [480, f1((s.alloc[d] / s.need[d]) * 100) + "%"]], 0, 10, 16]));
  L.push([[[40, `Remaining capacity: ${f1(s.cfg.supply - sum(s.alloc))} MW   Reserve margin: ${s.cfg.reserve}%   Severity: ${s.cfg.severity}/5`]], 0, 10, 16]);
  return makePdf("Simulation report " + s.id, "Run by " + s.by, L);
};
const simCsv = (s) => csv([["Simulation", "Department", "Priority", "Required MW", "Allocated MW", "Met %", "Remaining MW"], ...D.map((d) => [s.id, d, s.cfg.priorities[d], f1(s.need[d]), f1(s.alloc[d]), f1((s.alloc[d] / s.need[d]) * 100), f1(s.need[d] - s.alloc[d])])]);
const histCsv = (h) => csv([["Simulation ID", "Disaster type", "Date and time", "Available MW", "Demand MW", "Allocated MW", "Status"], ...h.map((s) => [s.id, s.type, s.ts.replace("T", " "), f1(s.cfg.supply), f1(sum(s.need)), f1(sum(s.alloc)), s.status])]);
const histPdf = (h) => makePdf("Simulation history summary", `${h.length} simulations`, [[[[40, "ID"], [130, "Type"], [230, "Date"], [330, "Avail MW"], [400, "Alloc MW"], [480, "Status"]], 2, 10, 18], ...h.map((s) => [[[40, s.id], [130, s.type], [230, s.ts.replace("T", " ")], [330, f1(s.cfg.supply)], [400, f1(sum(s.alloc))], [480, s.status]], 0, 10, 16])]);

/* ---------- small components ---------- */
const Badge = ({ t }) => { const k = { Completed: "ok", Active: "ok", Partial: "warn", Failed: "bad", Inactive: "mute", Critical: "bad", High: "warn", Medium: "info", Low: "mute" }[t] || "info"; return <span className={"badge " + k}>{t}</span>; };
const Card = ({ title, right, children, cls = "" }) => <section className={"card " + cls}>{(title || right) && <div className="ch"><h3>{title}</h3><div className="row">{right}</div></div>}{children}</section>;
const Modal = ({ title, onClose, children }) => <div className="ov" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}><div className="ch"><h3>{title}</h3><button className="ib" aria-label="Close" onClick={onClose}><X size={16} /></button></div>{children}</div></div>;
const Btn = ({ icon: I, children, ok = true, why, cls = "", ...p }) => <button className={"btn " + cls} disabled={!ok} title={ok ? undefined : why} {...p}>{!ok ? <Lock size={14} /> : I && <I size={14} />}{children}</button>;

function Ribbon({ supply, need, alloc, reserve }) {
  const tot = Math.max(supply, sum(need)), unmet = sum(need) - sum(alloc);
  const seg = (v, bg, l, extra) => <div title={`${l}: ${f1(v)} MW`} style={{ width: (v / tot) * 100 + "%", background: bg, ...extra }} />;
  return (
    <div>
      <div className="ribbon">{D.map((d) => seg(alloc[d], COL[d], d))}{seg(Math.max(supply - sum(alloc), 0), "#27456b", "Remaining capacity")}{unmet > 0.05 && seg(unmet, "repeating-linear-gradient(45deg,#ff5d6c55 0 4px,#ff5d6c22 4px 8px)", "Unmet demand", { borderLeft: "1px dashed #ff5d6c" })}</div>
      <div className="legend">{D.map((d) => <span key={d}><i style={{ background: COL[d] }} />{d} {f1(alloc[d])}</span>)}<span><i style={{ background: "#27456b" }} />Remaining {f1(Math.max(supply - sum(alloc), 0))}</span><span><i style={{ background: "#ff5d6c66" }} />Unmet {f1(Math.max(unmet, 0))} MW</span></div>
    </div>
  );
}

/* ---------- Reports ---------- */
function Reports({ hist, can, selId, setSelId, toast }) {
  const [q, setQ] = useState(""), [view, setView] = useState(null);
  const sel = hist.find((s) => s.id === selId) || hist[0];
  const ex = can("export"), why = "Your role cannot export reports";
  const rows = hist.filter((s) => (s.id + s.type + s.status).toLowerCase().includes(q.toLowerCase()));
  const dep = D.map((d) => ({ name: d, Required: sel.need[d], Allocated: sel.alloc[d], met: sel.need[d] ? (sel.alloc[d] / sel.need[d]) * 100 : 0, pr: sel.cfg.priorities[d] }));
  const hs = [...hist].reverse().map((s) => ({ id: s.id.slice(-3), Available: s.cfg.supply, Allocated: sum(s.alloc), Demand: sum(s.need), util: s.cfg.supply ? (sum(s.alloc) / s.cfg.supply) * 100 : 0 }));
  const done = hist.filter((s) => s.status !== "Failed"), avgU = done.reduce((a, s) => a + (sum(s.alloc) / s.cfg.supply) * 100, 0) / (done.length || 1);
  const tiers = PR.map((p) => { const ds = D.filter((d) => sel.cfg.priorities[d] === p); const n = ds.reduce((a, d) => a + sel.need[d], 0), al = ds.reduce((a, d) => a + sel.alloc[d], 0); return { p, ds, pct: n ? (al / n) * 100 : null }; });
  const act = (fn, name, msg) => { fn(); toast(msg); };
  const tk = { fill: "#8aa4c4", fontSize: 12 };
  return (
    <div className="stack">
      <Card title={`Allocation report - ${sel.id}`} right={<><select value={sel.id} onChange={(e) => setSelId(e.target.value)} aria-label="Simulation">{hist.map((s) => <option key={s.id}>{s.id}</option>)}</select>
        <Btn icon={Download} ok={ex} why={why} onClick={() => act(() => dl(sel.id + ".pdf", "application/pdf", simPdf(sel)), 0, "PDF report downloaded")}>PDF</Btn>
        <Btn icon={FileText} ok={ex} why={why} onClick={() => act(() => dl(sel.id + "-allocation.csv", "text/csv", simCsv(sel)), 0, "CSV exported")}>CSV</Btn></>}>
        <div className="kpis">{[["Total distributed", f1(sum(sel.alloc)) + " MW"], ["Remaining capacity", f1(sel.cfg.supply - sum(sel.alloc)) + " MW"], ["Total available", f1(sel.cfg.supply) + " MW"], ["Demand met", f1((sum(sel.alloc) / sum(sel.need)) * 100) + "%"], ["Utilization", f1((sum(sel.alloc) / sel.cfg.supply) * 100) + "%"]].map(([l, v]) => <div key={l} className="kpi"><b>{v}</b><span>{l}</span></div>)}</div>
        <Ribbon supply={sel.cfg.supply} need={sel.need} alloc={sel.alloc} />
        <div className="scroll"><table><thead><tr><th>Department</th><th>Priority</th><th>Required MW</th><th>Allocated MW</th><th>Remaining need MW</th><th>Demand met</th></tr></thead><tbody>{D.map((d) => <tr key={d}><td><i className="dot" style={{ background: COL[d] }} />{d}</td><td><Badge t={sel.cfg.priorities[d]} /></td><td>{f1(sel.need[d])}</td><td>{f1(sel.alloc[d])}</td><td>{f1(sel.need[d] - sel.alloc[d])}</td><td><div className="bar"><div style={{ width: Math.min(100, (sel.alloc[d] / sel.need[d]) * 100) + "%", background: COL[d] }} /></div> {f1((sel.alloc[d] / sel.need[d]) * 100)}%</td></tr>)}</tbody></table></div>
      </Card>
      <div className="grid2">
        <Card title="Required vs allocated by department"><ResponsiveContainer width="100%" height={260}><BarChart data={dep}><CartesianGrid stroke="#1c3556" vertical={false} /><XAxis dataKey="name" tick={tk} interval={0} tickFormatter={(v) => v.split(" ")[0]} /><YAxis tick={tk} unit=" MW" width={62} /><Tooltip contentStyle={{ background: "#0c1b30", border: "1px solid #1c3556" }} /><Legend /><Bar dataKey="Required" fill="#3b82f6" radius={[3, 3, 0, 0]} /><Bar dataKey="Allocated" fill="#22d3ee" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></Card>
        <Card title="Electricity distribution"><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={[...dep.map((d) => ({ name: d.name, v: d.Allocated })), { name: "Remaining", v: Math.max(sel.cfg.supply - sum(sel.alloc), 0) }]} dataKey="v" innerRadius={62} outerRadius={95} paddingAngle={2} stroke="none">{[...D, "Remaining"].map((d) => <Cell key={d} fill={COL[d] || "#27456b"} />)}</Pie><Tooltip contentStyle={{ background: "#0c1b30", border: "1px solid #1c3556" }} formatter={(v) => f1(v) + " MW"} /><Legend /></PieChart></ResponsiveContainer></Card>
        <Card title="Historical comparison" cls="span"><ResponsiveContainer width="100%" height={250}><ComposedChart data={hs}><CartesianGrid stroke="#1c3556" vertical={false} /><XAxis dataKey="id" tick={tk} tickFormatter={(v) => "#" + v} /><YAxis yAxisId="l" tick={tk} unit=" MW" width={62} /><YAxis yAxisId="r" orientation="right" tick={tk} unit="%" domain={[0, 100]} width={44} /><Tooltip contentStyle={{ background: "#0c1b30", border: "1px solid #1c3556" }} /><Legend /><Bar yAxisId="l" dataKey="Available" fill="#27456b" radius={[3, 3, 0, 0]} /><Bar yAxisId="l" dataKey="Allocated" fill="#22d3ee" radius={[3, 3, 0, 0]} /><Line yAxisId="r" dataKey="util" name="Utilization %" stroke="#f5b942" strokeWidth={2} dot /></ComposedChart></ResponsiveContainer></Card>
      </div>
      <div className="grid2">
        <Card title="Utilization statistics"><div className="kpis two"><div className="kpi"><b>{f1(avgU)}%</b><span>Average utilization</span></div><div className="kpi"><b>{hist.length}</b><span>Simulations run</span></div><div className="kpi"><b>{f1(Math.max(...hist.map((s) => sum(s.alloc))))} MW</b><span>Peak allocation</span></div><div className="kpi"><b>{hist.filter((s) => s.status === "Failed").length}</b><span>Failed runs</span></div></div></Card>
        <Card title="Department priority comparison"><div className="stack sm">{tiers.map((t) => <div key={t.p}><div className="row sp"><Badge t={t.p} /><small>{t.ds.join(", ") || "No departments"}</small><b>{t.pct == null ? "-" : f1(t.pct) + "%"}</b></div><div className="bar big"><div style={{ width: (t.pct || 0) + "%" }} /></div></div>)}</div></Card>
      </div>
      <Card title="Simulation history" right={<><div className="search"><Search size={14} /><input placeholder="Search ID, type, status" value={q} onChange={(e) => setQ(e.target.value)} /></div><Btn icon={Download} ok={ex} why={why} onClick={() => act(() => dl("simulation-history.pdf", "application/pdf", histPdf(hist)), 0, "History PDF downloaded")}>PDF</Btn><Btn icon={FileText} ok={ex} why={why} onClick={() => act(() => dl("simulation-history.csv", "text/csv", histCsv(hist)), 0, "History CSV exported")}>CSV</Btn></>}>
        <div className="scroll"><table><thead><tr><th>Simulation ID</th><th>Disaster type</th><th>Date and time</th><th>Available MW</th><th>Allocated MW</th><th>Status</th><th>Report</th></tr></thead><tbody>
          {rows.map((s) => <tr key={s.id}><td className="mono">{s.id}</td><td>{s.type}</td><td>{s.ts.replace("T", " ")}</td><td>{f1(s.cfg.supply)}</td><td>{f1(sum(s.alloc))}</td><td><Badge t={s.status} /></td><td className="row"><button className="ib" title="View report" onClick={() => setView(s)}><Eye size={15} /></button><button className="ib" title={ex ? "Download PDF" : why} disabled={!ex} onClick={() => act(() => dl(s.id + ".pdf", "application/pdf", simPdf(s)), 0, "PDF report downloaded")}><Download size={15} /></button></td></tr>)}
          {!rows.length && <tr><td colSpan="7" className="empty">No simulations match. Clear the search to see all runs.</td></tr>}</tbody></table></div>
      </Card>
      {view && <Modal title={`${view.id} - ${view.type}`} onClose={() => setView(null)}><p className="muted">Run {view.ts.replace("T", " ")} by {view.by} - severity {view.cfg.severity}/5, reserve {view.cfg.reserve}% - <Badge t={view.status} /></p><Ribbon supply={view.cfg.supply} need={view.need} alloc={view.alloc} /><div className="scroll"><table><thead><tr><th>Department</th><th>Priority</th><th>Required</th><th>Allocated</th></tr></thead><tbody>{D.map((d) => <tr key={d}><td>{d}</td><td><Badge t={view.cfg.priorities[d]} /></td><td>{f1(view.need[d])}</td><td>{f1(view.alloc[d])}</td></tr>)}</tbody></table></div><div className="row end"><Btn ok={ex} why={why} icon={Download} onClick={() => dl(view.id + ".pdf", "application/pdf", simPdf(view))}>PDF</Btn><Btn ok={ex} why={why} icon={FileText} onClick={() => dl(view.id + ".csv", "text/csv", simCsv(view))}>CSV</Btn></div></Modal>}
    </div>
  );
}

/* ---------- Admin ---------- */
function UserForm({ u, users, me, onSave, onClose }) {
  const [f, setF] = useState(u || { name: "", email: "", role: "Viewer", dept: "Control Room", active: true }), [err, setErr] = useState("");
  const roles = me.role === "Super Admin" ? ROLES : ROLES.slice(1);
  const go = () => {
    if (!f.name.trim()) return setErr("Enter the user's name.");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr("Enter a valid email address.");
    if (users.some((x) => x.email.toLowerCase() === f.email.toLowerCase() && x.id !== f.id)) return setErr("That email is already assigned to another user.");
    onSave(f);
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return <Modal title={u ? "Edit user" : "Add user"} onClose={onClose}><div className="form"><label>Name<input value={f.name} onChange={set("name")} /></label><label>Email<input value={f.email} onChange={set("email")} /></label><label>Role<select value={f.role} onChange={set("role")}>{roles.map((r) => <option key={r}>{r}</option>)}</select></label><label>Department<select value={f.dept} onChange={set("dept")}>{["Control Room", "Disaster Cell", ...D].map((r) => <option key={r}>{r}</option>)}</select></label><label className="row"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Account active</label>{err && <p className="err" role="alert">{err}</p>}<div className="row end"><Btn cls="ghost" onClick={onClose}>Cancel</Btn><Btn cls="pri" onClick={go}>Save user</Btn></div></div></Modal>;
}

function Admin({ A }) {
  const { cfg, setCfg, users, setUsers, perms, setPerms, me, can, ask, toast, note, runSim, resetAll } = A;
  const [seg, setSeg] = useState("Users"), [form, setForm] = useState(null), [draft, setDraft] = useState(cfg), [err, setErr] = useState("");
  useEffect(() => setDraft(cfg), [cfg]);
  const protect = (u) => u.role === "Super Admin" && me.role !== "Super Admin";
  const supers = users.filter((u) => u.role === "Super Admin" && u.active).length;
  const save = (f) => { if (f.id) { setUsers(users.map((u) => (u.id === f.id ? f : u))); note(`User ${f.name} updated`); } else { setUsers([...users, { ...f, id: Date.now() }]); note(`User ${f.name} added`); } setForm(null); toast("User saved"); };
  const toggle = (u) => { if (u.id === me.id || (u.role === "Super Admin" && u.active && supers < 2)) return toast("You can't deactivate your own account or the last active Super Admin."); setUsers(users.map((x) => (x.id === u.id ? { ...x, active: !x.active } : x))); note(`${u.name} ${u.active ? "deactivated" : "activated"}`); };
  const del = (u) => { if (u.id === me.id || (u.role === "Super Admin" && supers < 2)) return toast("You can't delete your own account or the last active Super Admin."); ask(`Delete ${u.name}?`, "This removes the account permanently.", () => { setUsers(users.filter((x) => x.id !== u.id)); note(`User ${u.name} deleted`); toast("User deleted"); }); };
  const setP = (d, p) => { setCfg({ ...cfg, priorities: { ...cfg.priorities, [d]: p } }); note(`${d} priority set to ${p}`); toast(`${d}: ${p}`); };
  const saveCfg = () => {
    const bad = D.some((d) => !(draft.demands[d] >= 0)) || !(draft.supply > 0) || draft.reserve < 0 || draft.reserve > 50 || draft.guarantee < 0 || draft.guarantee > 100;
    if (bad) return setErr("Check the values: supply above 0, demands 0 or more, reserve 0-50%, guarantee 0-100%.");
    setErr(""); setCfg(draft); note("Simulation configuration saved"); toast("Configuration saved - dashboards updated");
  };
  const num = (fn) => (e) => fn(e.target.value === "" ? NaN : +e.target.value);
  const cu = can("conf"), pu = can("prio");
  const lock = (ok, why) => !ok && <p className="lockmsg"><Lock size={13} /> {why}</p>;
  return (
    <div className="stack">
      <div className="seg" role="tablist">{["Users", "Priorities", "Simulation", "Permissions"].map((s) => <button key={s} role="tab" aria-selected={seg === s} className={seg === s ? "on" : ""} onClick={() => setSeg(s)}>{{ Users: "User management", Priorities: "Department priorities", Simulation: "Simulation configuration", Permissions: "Access permissions" }[s]}</button>)}</div>
      {seg === "Users" && <Card title="User management" right={<Btn icon={Plus} cls="pri" ok={can("users")} why="Your role cannot manage users" onClick={() => setForm({})}>Add user</Btn>}>
        <div className="scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead><tbody>{users.map((u) => <tr key={u.id}><td>{u.name}{u.id === me.id && <small> (you)</small>}</td><td>{u.email}</td><td>{u.role}</td><td>{u.dept}</td><td><button className="sw" role="switch" aria-checked={u.active} aria-label={`Toggle ${u.name}`} disabled={!can("users") || protect(u)} onClick={() => toggle(u)}><i /></button> <Badge t={u.active ? "Active" : "Inactive"} /></td><td className="row"><button className="ib" title="Edit" disabled={!can("users") || protect(u)} onClick={() => setForm(u)}><Pencil size={15} /></button><button className="ib danger" title="Delete" disabled={!can("users") || protect(u)} onClick={() => del(u)}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>{lock(can("users"), "Your role has read-only access to user accounts.")}</Card>}
      {seg === "Priorities" && <Card title="Department priority settings">{lock(pu, "Your role cannot change priorities.")}<div className="grid2">{D.map((d) => <div key={d} className="prio"><div className="row sp"><b><i className="dot" style={{ background: COL[d] }} />{d}</b><Badge t={cfg.priorities[d]} /></div><div className="seg sm">{PR.map((p) => <button key={p} disabled={!pu} className={cfg.priorities[d] === p ? "on" : ""} onClick={() => setP(d, p)}>{p}</button>)}</div></div>)}</div><p className="muted">Changes apply immediately to the dashboard, AI negotiation and the next simulation.</p></Card>}
      {seg === "Simulation" && <Card title="Simulation configuration" right={<><Btn icon={Play} ok={can("run")} why="Your role cannot run simulations" cls="pri" onClick={runSim}>Run simulation</Btn><Btn icon={RotateCcw} ok={can("reset")} why="Your role cannot reset scenarios" cls="danger" onClick={() => ask("Reset all simulated scenarios?", "Configuration returns to defaults and history is restored to the original sample runs. Runs you created will be removed.", resetAll)}>Reset scenarios</Btn></>}>
        {lock(cu, "Your role cannot edit configuration.")}
        <div className="form cols"><label>Available electricity (MW)<input type="number" disabled={!cu} value={Number.isNaN(draft.supply) ? "" : draft.supply} onChange={num((v) => setDraft({ ...draft, supply: v }))} /></label>
          {D.map((d) => <label key={d}>{d} demand (MW)<input type="number" disabled={!cu} value={Number.isNaN(draft.demands[d]) ? "" : draft.demands[d]} onChange={num((v) => setDraft({ ...draft, demands: { ...draft.demands, [d]: v } }))} /></label>)}
          <label>Disaster scenario<select disabled={!cu} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label>Severity (1-5): {draft.severity}<input type="range" min="1" max="5" disabled={!cu} value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: +e.target.value })} /></label>
          <label>Grid reserve margin (%)<input type="number" disabled={!cu} value={Number.isNaN(draft.reserve) ? "" : draft.reserve} onChange={num((v) => setDraft({ ...draft, reserve: v }))} /></label>
          <label>Minimum guarantee per department (%)<input type="number" disabled={!cu} value={Number.isNaN(draft.guarantee) ? "" : draft.guarantee} onChange={num((v) => setDraft({ ...draft, guarantee: v }))} /></label></div>
        {err && <p className="err" role="alert">{err}</p>}<div className="row end"><Btn cls="pri" ok={cu} why="Your role cannot edit configuration" onClick={saveCfg}>Save configuration</Btn></div></Card>}
      {seg === "Permissions" && <Card title="Access permissions">{lock(can("perms"), "Only Super Admin can change role permissions.")}<div className="scroll"><table><thead><tr><th>Permission</th>{ROLES.map((r) => <th key={r}>{r}</th>)}</tr></thead><tbody>{Object.entries(PERMS).map(([k, l]) => <tr key={k}><td>{l}</td>{ROLES.map((r) => <td key={r}><input type="checkbox" aria-label={`${r}: ${l}`} checked={perms[r].includes(k)} disabled={!can("perms") || r === "Super Admin"} onChange={(e) => { setPerms({ ...perms, [r]: e.target.checked ? [...perms[r], k] : perms[r].filter((x) => x !== k) }); note(`${r}: ${l} ${e.target.checked ? "granted" : "revoked"}`); }} /></td>)}</tr>)}</tbody></table></div></Card>}
      {form && <UserForm u={form.id ? form : null} users={users} me={me} onSave={save} onClose={() => setForm(null)} />}
    </div>
  );
}

/* ---------- Other pages (driven by saved configuration) ---------- */
function Info({ page, cfg }) {
  const r = useMemo(() => engine(cfg), [cfg]);
  return (
    <div className="stack">
      <Card title={`Live configuration - ${cfg.type}, severity ${cfg.severity}/5`}><Ribbon supply={cfg.supply} need={r.need} alloc={r.alloc} reserve={cfg.reserve} /></Card>
      <Card title={page === "City Monitoring" ? "Critical services load" : page === "AI Negotiation" ? "Negotiation outcome" : "Department status"}>
        <div className="scroll"><table><thead><tr><th>Department</th><th>Priority</th><th>Demand MW</th><th>Allocated MW</th>{page === "AI Negotiation" && <th>Outcome</th>}</tr></thead><tbody>{D.map((d) => <tr key={d}><td>{d}</td><td><Badge t={cfg.priorities[d]} /></td><td>{f1(r.need[d])}</td><td>{f1(r.alloc[d])}</td>{page === "AI Negotiation" && <td>{r.alloc[d] >= r.need[d] - 0.05 ? "Fully supplied" : `${cfg.priorities[d]} priority; ${f1(r.need[d] - r.alloc[d])} MW unmet`}</td>}</tr>)}</tbody></table></div>
        <p className="muted">Values are recalculated from the saved administration settings. Simulated data only.</p></Card>
    </div>
  );
}

/* ---------- App ---------- */
export default function App() {
  const [cfg, setCfg] = useState(DEF_CFG), [hist, setHist] = useState(SEED), [users, setUsers] = useState(USERS), [perms, setPerms] = useState(DEF_PERMS);
  const [meId, setMeId] = useState(1), [page, setPage] = useState("Administration & Reports"), [tab, setTab] = useState("Reports & History"), [selId, setSelId] = useState("SIM-2026-006");
  const [notes, setNotes] = useState([{ t: "Simulation SIM-2026-006 completed with unmet demand", n: 1, id: 0 }]), [bell, setBell] = useState(false), [prof, setProf] = useState(false), [nav, setNav] = useState(false);
  const [toastM, setToastM] = useState(""), [cf, setCf] = useState(null), [out, setOut] = useState(false);
  const me = users.find((u) => u.id === meId && u.active) || users.find((u) => u.active);
  const can = (p) => perms[me.role].includes(p);
  const toast = (m) => { setToastM(m); setTimeout(() => setToastM(""), 2600); };
  const note = (t) => setNotes((n) => [{ t, n: 1, id: Date.now() + Math.random() }, ...n].slice(0, 12));
  const ask = (title, body, fn) => setCf({ title, body, fn });
  const runSim = () => { const id = "SIM-2026-" + String(hist.length + 1).padStart(3, "0"), s = mkSim(id, cfg, new Date().toISOString().slice(0, 16), 0, me.name); setHist([s, ...hist]); setSelId(id); setTab("Reports & History"); setPage("Administration & Reports"); note(`${id} completed (${s.status})`); toast(`${id} added to history`); };
  const resetAll = () => { setCfg(DEF_CFG); setHist(SEED()); setSelId("SIM-2026-006"); note("Scenarios reset to defaults"); toast("Scenarios reset"); };
  const A = { cfg, setCfg, users, setUsers, perms, setPerms, me, can, ask, toast, note, runSim, resetAll };
  const chatContext = { app: "admin", admin: { config: cfg, role: me.role, canConfigure: can("conf"), canRun: can("run"), simulated: true } };
  useEffect(() => {
    const publish = () => fetch("http://127.0.0.1:5177/api/platform/snapshot", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${readSessionToken()}` }, body: JSON.stringify({ app: "admin", data: chatContext }) }).catch(() => {});
    void publish(); const id = window.setInterval(publish, 8000); return () => window.clearInterval(id);
  }, [cfg, me.role]);
  const approveChatActions = (actions) => {
    const changes = actions.filter((a) => a.type === "admin_setting");
    if (changes.length && !can("conf")) throw new Error("Your current admin role cannot change simulation configuration. Ask an administrator to approve these settings.");
    const next = { ...cfg };
    for (const action of changes) {
      const value = ["supply", "reserve", "guarantee", "severity"].includes(action.field) ? Number(action.value) : String(action.value);
      if (["supply", "reserve", "guarantee", "severity"].includes(action.field) && !Number.isFinite(value)) throw new Error(`Invalid value for ${action.field}.`);
      if (action.field === "supply" && value <= 0) throw new Error("Supply must be greater than zero.");
      if (action.field === "reserve" && (value < 0 || value > 50)) throw new Error("Reserve must be between 0 and 50%.");
      if (action.field === "guarantee" && (value < 0 || value > 100)) throw new Error("Guarantee must be between 0 and 100%.");
      if (action.field === "severity" && (value < 1 || value > 5)) throw new Error("Severity must be between 1 and 5.");
      if (action.field === "type" && !TYPES.includes(value)) throw new Error("Choose a supported disaster scenario.");
      next[action.field] = value;
    }
    if (changes.length) { setCfg(next); note(`AI-approved configuration submitted by ${me.name}`); toast("Approved configuration applied"); }
    if (actions.some((a) => a.type === "set_allocation" || a.type === "set_priority" || a.type === "set_capacity")) toast("Approved Operations changes sent to the Operations Dashboard");
    if (actions.some((a) => a.type === "response_plan")) note("AI response plan approved and submitted");
    if (actions.some((a) => a.type === "run_negotiation")) { if (!can("run")) throw new Error("Your current role cannot run negotiations."); runSim(); }
  };
  const navs = [["Unified Dashboard", LayoutDashboard], ["City Monitoring", Radar], ["AI Negotiation", Brain], ["Administration & Reports", FileBarChart]];
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  if (out) return <div className="app"><style>{CSS}</style><div className="center"><img src={LOGO} alt="ResQGrid" className="logo" /><h2>You have signed out</h2><p className="muted">Simulated session ended.</p><Btn cls="pri" onClick={() => setOut(false)}>Sign in again</Btn></div></div>;
  return (
    <div className="app"><style>{CSS}</style>
      <aside className={nav ? "side open" : "side"}>
        <div className="brand"><div className="chip"><img src={LOGO} alt="ResQGrid" /></div><button className="ib burger" aria-label="Menu" onClick={() => setNav(!nav)}>Menu</button></div>
        <nav>{navs.map(([n, I]) => <button key={n} className={page === n ? "on" : ""} onClick={() => { setPage(n); setNav(false); }}><I size={17} />{n}</button>)}<button onClick={() => { window.location.href = "http://127.0.0.1:5173/#rq-session=" + encodeURIComponent(readSessionToken()); }}><LayoutDashboard size={17} />Main Website</button><button onClick={() => { window.location.href = "http://127.0.0.1:5174/#rq-session=" + encodeURIComponent(readSessionToken()); }}><Brain size={17} />Operations Dashboard</button><button onClick={() => { window.location.href = "http://127.0.0.1:5175/city-monitoring#rq-session=" + encodeURIComponent(readSessionToken()); }}><Radar size={17} />City Monitoring Map</button><button className="lo" onClick={() => ask("Log out?", "Your simulated session will end.", () => { setOut(true); void signOutGovernment(); })}><LogOut size={17} />Logout</button></nav>
      </aside>
      <main>
        <header className="top">
          <div><h1>{page === "Administration & Reports" ? "Administration & Reports" : page}</h1><p className="muted">{page === "Administration & Reports" ? "Manage system operations, review simulation history and control administrative settings." : "Driven by the saved administration settings."}</p></div>
          <div className="row hd">
            <span className="status"><i />All systems operational</span><span className="date">{date}</span>
            <div className="pop"><button className="ib" aria-label="Notifications" onClick={() => { setBell(!bell); setProf(false); setNotes(notes.map((x) => ({ ...x, n: 0 }))); }}><Bell size={18} />{notes.some((x) => x.n) && <em>{notes.filter((x) => x.n).length}</em>}</button>{bell && <div className="menu"><b>Notifications</b>{notes.map((x) => <p key={x.id}>{x.t}</p>)}</div>}</div>
            <div className="pop"><button className="me" onClick={() => { setProf(!prof); setBell(false); }}><span className="av">{me.name[0]}</span><span><b>{me.name}</b><small>{me.role}</small></span></button>{prof && <div className="menu"><b>Sign in as (demo)</b>{users.filter((u) => u.active).map((u) => <button key={u.id} className={u.id === me.id ? "on" : ""} onClick={() => { setMeId(u.id); setProf(false); toast(`Viewing as ${u.role}`); }}>{u.name} - {u.role}</button>)}</div>}</div>
          </div>
        </header>
        {page === "Administration & Reports" ? <>
          <div className="seg main" role="tablist">{["Reports & History", "Admin Settings"].map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}</div>
          {tab === "Reports & History" ? <Reports hist={hist} can={can} selId={selId} setSelId={setSelId} toast={toast} /> : <Admin A={A} />}
        </> : <Info page={page} cfg={cfg} />}
        <footer>ResQGrid uses simulated data only. It is not connected to any government or utility system.</footer>
      </main>
      {cf && <Modal title={cf.title} onClose={() => setCf(null)}><p>{cf.body}</p><div className="row end"><Btn cls="ghost" onClick={() => setCf(null)}>Cancel</Btn><Btn cls="danger" onClick={() => { cf.fn(); setCf(null); }}>Confirm</Btn></div></Modal>}
      {toastM && <div className="toast" role="status">{toastM}</div>}
      <ChatAssistant context={chatContext} onApprove={approveChatActions} />
    </div>
  );
}

const CSS = `
.app{--bg:#07111f;--s1:#0c1b30;--s2:#112440;--bd:#1c3556;--tx:#e6f0fb;--mu:#8aa4c4;--cy:#22d3ee;--bl:#2f7dff;display:flex;min-height:100vh;background:var(--bg);color:var(--tx);font-family:Bahnschrift,"DIN Alternate","Segoe UI",system-ui,sans-serif;font-size:14px}
.app *{box-sizing:border-box}.app button,.app input,.app select{font:inherit;color:inherit}
.side{width:210px;flex:none;background:#050d19;border-right:1px solid var(--bd);padding:14px 12px;position:sticky;top:0;height:100vh}
.brand{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}.chip{background:#f4efe0;border-radius:8px;padding:4px 6px;width:128px}.chip img{display:block;width:100%;height:auto}
.burger{display:none}.side nav{display:flex;flex-direction:column;gap:4px}
.side nav button{display:flex;gap:10px;align-items:center;background:none;border:0;border-radius:8px;padding:10px;text-align:left;color:var(--mu);cursor:pointer}
.side nav button:hover{background:var(--s1);color:var(--tx)}.side nav .on{background:var(--s2);color:var(--cy);box-shadow:inset 3px 0 var(--cy)}.side .lo{margin-top:24px;color:#ff8a95}
main{flex:1;min-width:0;padding:20px 26px}.top{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-start;margin-bottom:16px}
h1{margin:0;font-size:26px;letter-spacing:.2px}h3{margin:0;font-size:15px}.muted,small{color:var(--mu)}p.muted{margin:4px 0 0}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.sp{justify-content:space-between}.end{justify-content:flex-end;margin-top:12px}
.status{display:flex;gap:7px;align-items:center;color:#34d399;background:#0d2a2a;border:1px solid #1b5a4c;padding:5px 10px;border-radius:99px;font-size:12px}.status i{width:8px;height:8px;border-radius:9px;background:#34d399;animation:p 2s infinite}@keyframes p{50%{opacity:.35}}@media(prefers-reduced-motion:reduce){.status i{animation:none}}
.date{color:var(--mu);font-size:13px}.pop{position:relative}.ib{background:var(--s1);border:1px solid var(--bd);border-radius:8px;padding:7px;cursor:pointer;display:inline-flex;position:relative}.ib:disabled,.btn:disabled,.seg button:disabled{opacity:.4;cursor:not-allowed}.ib.danger:hover:not(:disabled){color:#ff5d6c}
.ib em{position:absolute;top:-5px;right:-5px;background:#ff5d6c;color:#fff;font-size:10px;border-radius:9px;padding:1px 5px;font-style:normal}
.me{display:flex;gap:9px;align-items:center;background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:5px 10px 5px 5px;cursor:pointer;text-align:left}.me small{display:block;font-size:11px}.av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--bl),var(--cy));display:grid;place-items:center;font-weight:700;color:#04121f}
.menu{position:absolute;right:0;top:calc(100% + 6px);z-index:20;width:290px;background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:6px;box-shadow:0 12px 30px #000a}.menu p{margin:0;padding:6px 0;border-top:1px solid var(--bd);font-size:13px}.menu button{background:none;border:0;text-align:left;padding:7px;border-radius:6px;cursor:pointer}.menu button:hover,.menu .on{background:var(--s2)}
.seg{display:flex;gap:4px;background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:4px;width:fit-content;max-width:100%;overflow:auto}.seg button{background:none;border:0;padding:8px 14px;border-radius:7px;cursor:pointer;color:var(--mu);white-space:nowrap}.seg .on{background:var(--bl);color:#fff}.seg.main{margin-bottom:16px}.seg.main .on{background:var(--cy);color:#04121f;font-weight:700}.seg.sm button{padding:6px 10px}.seg.sm .on{background:var(--s2);color:var(--cy)}
.stack{display:flex;flex-direction:column;gap:16px}.stack.sm{gap:12px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}.span{grid-column:1/-1}
.card{background:var(--s1);border:1px solid var(--bd);border-radius:12px;padding:16px;min-width:0}.ch{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}
.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px}.kpis.two{grid-template-columns:1fr 1fr;margin:0}.kpi{background:var(--s2);border-radius:10px;padding:12px;border-left:3px solid var(--cy)}.kpi b{display:block;font-size:20px;font-variant-numeric:tabular-nums}.kpi span{color:var(--mu);font-size:12px}
.ribbon{display:flex;height:30px;border-radius:6px;overflow:hidden;background:#0a1628;border:1px solid var(--bd)}.ribbon div{min-width:0}.legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin:8px 0 14px;font-size:12px;color:var(--mu)}.legend i,.dot{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px}
.scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:560px}th{text-align:left;color:var(--mu);font-weight:500;font-size:12px;padding:8px 10px;border-bottom:1px solid var(--bd)}td{padding:10px;border-bottom:1px solid #14284532;font-variant-numeric:tabular-nums}tbody tr:hover{background:#112440aa}.mono{font-family:ui-monospace,Consolas,monospace;font-size:13px}.empty{text-align:center;color:var(--mu);padding:24px}
.bar{display:inline-block;vertical-align:middle;width:70px;height:6px;background:#0a1628;border-radius:9px;overflow:hidden}.bar div{height:100%;border-radius:9px}.bar.big{display:block;width:100%;height:8px;margin-top:6px}.bar.big div{background:linear-gradient(90deg,var(--bl),var(--cy))}
.badge{display:inline-block;padding:2px 9px;border-radius:99px;font-size:12px;font-weight:600;border:1px solid}.ok{color:#34d399;background:#0d2a2a;border-color:#1b5a4c}.warn{color:#fbbf24;background:#2d2410;border-color:#6b5316}.bad{color:#ff7a86;background:#2d1119;border-color:#6b2230}.info{color:#67b0ff;background:#10264a;border-color:#245192}.mute{color:var(--mu);background:#0f1d33;border-color:var(--bd)}
.btn{display:inline-flex;gap:6px;align-items:center;background:var(--s2);border:1px solid var(--bd);border-radius:8px;padding:7px 12px;cursor:pointer}.btn:hover:not(:disabled){border-color:var(--cy)}.btn.pri{background:var(--cy);color:#04121f;border-color:var(--cy);font-weight:700}.btn.danger{background:#2d1119;border-color:#6b2230;color:#ff9aa4}.btn.ghost{background:none}
select,input[type=number],input:not([type]),.form input{background:#081528;border:1px solid var(--bd);border-radius:8px;padding:8px 10px;min-width:0}.search{display:flex;align-items:center;gap:6px;background:#081528;border:1px solid var(--bd);border-radius:8px;padding:0 8px}.search input{background:none;border:0;padding:7px 0;width:150px;outline:0}
.app :focus-visible{outline:2px solid var(--cy);outline-offset:2px}
.form{display:flex;flex-direction:column;gap:12px}.form.cols{display:grid;grid-template-columns:repeat(2,1fr)}.form label{display:flex;flex-direction:column;gap:5px;color:var(--mu);font-size:13px}.form label.row{flex-direction:row;color:var(--tx)}.err{color:#ff7a86;margin:0}.lockmsg{color:#fbbf24;display:flex;gap:6px;align-items:center;margin:0 0 12px;font-size:13px}
.prio{background:var(--s2);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:12px}
.sw{width:36px;height:20px;border-radius:99px;border:0;background:#27456b;padding:2px;cursor:pointer;vertical-align:middle}.sw i{display:block;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .15s}.sw[aria-checked=true]{background:var(--cy)}.sw[aria-checked=true] i{transform:translateX(16px)}
.ov{position:fixed;inset:0;background:#02060cb0;display:grid;place-items:center;z-index:50;padding:14px}.modal{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:18px;width:min(640px,100%);max-height:90vh;overflow:auto}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--cy);color:#04121f;padding:10px 18px;border-radius:99px;font-weight:700;z-index:60}
footer{margin-top:22px;color:var(--mu);font-size:12px;text-align:center}.center{margin:auto;text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center}.logo{width:200px;border-radius:10px}
@media(max-width:1100px){.kpis{grid-template-columns:repeat(3,1fr)}}
@media(max-width:900px){.app{flex-direction:column}.side{width:100%;height:auto;position:static;padding:10px}.brand{margin:0}.side nav{display:none;margin-top:10px}.side.open nav{display:flex}.burger{display:inline-flex}.grid2,.form.cols{grid-template-columns:1fr}main{padding:14px}.menu{right:auto;left:0;width:min(290px,80vw)}}
@media(max-width:560px){.kpis{grid-template-columns:1fr 1fr}h1{font-size:21px}.date{display:none}}
`;
