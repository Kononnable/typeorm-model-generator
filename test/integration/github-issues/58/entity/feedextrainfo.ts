import {Index,Entity, PrimaryColumn, Column, OneToOne, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable} from "typeorm";
import {users} from "./users";
import {quests} from "./quests";


@Entity("feedextrainfo")
@Index("feedExtraInfo_FeedOwnerId_idx",["FeedOwnerId",])
@Index("feedExtraInfo_ReaderId_idx",["ReaderId",])
@Index("feedExtraInfo_QuestId_idx",["QuestId",])
export class feedextrainfo {

   
    @OneToOne(type=>users, FeedOwnerId=>FeedOwnerId.feedextrainfo,{primary:true, nullable:false, })
    @JoinColumn({ name:'FeedOwnerId'})
    FeedOwnerId:users;
    

   
    @OneToOne(type=>quests, QuestId=>QuestId.feedextrainfo,{primary:true, nullable:false, })
    @JoinColumn({ name:'QuestId'})
    QuestId:quests;
    

   
    @OneToOne(type=>users, ReaderId=>ReaderId.feedextrainfo2,{primary:true, nullable:false, })
    @JoinColumn({ name:'ReaderId'})
    ReaderId:users;
    

    @Column("int",{ 
        nullable:false,
        name:"MostUpdatedFeedEntryIdUserRead"
        })
    MostUpdatedFeedEntryIdUserRead:number;
        
}
